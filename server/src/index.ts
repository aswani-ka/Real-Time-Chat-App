import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cookie from "cookie";

import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import messageRoutes from "./routes/message.routes";
import groupRoutes from "./routes/group.routes";
import userRoutes from "./routes/user.route";
import authProxy from "./proxy/auth.proxy";

import Message from "./models/Message";
import chatbot from "./socket/chatbot";
import User from "./models/User";


const app = express();
const server = http.createServer(app);


/* ================= MIDDLEWARE ================= */

const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL, // your vercel url
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

/* ================= SOCKET ================= */

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});



app.use(express.json());
app.use(cookieParser());

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/messages", authProxy, messageRoutes);
app.use("/api/groups", authProxy, groupRoutes);
app.use("/api/users", authProxy, userRoutes);

/* ================= ONLINE USER TRACKING ================= */

// username -> Set<socketId>
const userSockets = new Map<string, Set<string>>();

/* ================= SOCKET AUTH ================= */

io.use((socket, next) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    if (!rawCookie) return next(new Error("No cookies found!"));

    const cookies = cookie.parse(rawCookie);
    const token = cookies.token;
    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      username: string;
      userId: string;
    };

    socket.data.username = decoded.username;
    socket.data.userId = decoded.userId;

    next();
  } catch (err) {
    console.error("Socket auth error:", err);
    next(new Error("Socket authentication failed"));
  }
});



/* ================= SOCKET LOGIC ================= */

io.on("connection", (socket) => {
  const username = socket.data.username as string;
  const userId = socket.data.userId as string;

  console.log("🟢 Connected:", username, socket.id);

  if (!userSockets.has(username)) userSockets.set(username, new Set());
  userSockets.get(username)!.add(socket.id);

  User.findByIdAndUpdate(userId, { isOnline: true }).catch(console.error);

  io.emit("userStatusUpdated", { username, isOnline: true });

  /* JOIN ROOM */
  socket.on("joinRoom", (roomId: string) => {
    socket.join(roomId);
    updateGroupOnlineUsers(roomId);
  });

  /* TYPING */
  socket.on("typing", ({ roomId }: { roomId: string }) => {
    if (!roomId) return;
    socket.to(roomId).emit("userTyping", username); // ✅ string
  });

  socket.on("stopTyping", (roomId: string) => {
    if (!roomId) return;
    socket.to(roomId).emit("userStopTyping"); // ✅ ok
  });

  /* SEND MESSAGE */
  socket.on("sendMessage", async ({ roomId, message }: { roomId: string; message: string }) => {
    try {
      if (!roomId || !message?.trim()) return;

      const msg = await Message.create({
        senderName: username,     // ✅ must be username string
        receiverName: "GROUP",
        roomId,
        message,
        status: "sent",
      });

      io.to(roomId).emit("receiveMessage", msg);

      msg.status = "delivered";
      await msg.save();
      io.to(roomId).emit("messageUpdated", msg);

      // BOT
      if (message.startsWith("/bot")) {
        const reply = await chatbot(message);
        const botMsg = await Message.create({
          senderName: "Chatbot",
          receiverName: username,
          roomId,
          message: reply,
          status: "delivered",
        });
        io.to(roomId).emit("receiveMessage", botMsg);
      }
    } catch (err) {
      console.error("❌ sendMessage error:", err);
    }
  });

  /* EDIT MESSAGE (only author) */
  socket.on("editMessage", async ({ messageId, newText }: { messageId: string; newText: string }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg || msg.isDeleted) return;
      if (msg.senderName !== username) return;

      msg.message = newText;
      await msg.save();
      io.to(msg.roomId).emit("messageUpdated", msg);
    } catch (err) {
      console.error("❌ editMessage error:", err);
    }
  });

  /* DELETE MESSAGE (only author) */
  socket.on("deleteMessage", async (messageId: string) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      if (msg.senderName !== username) return;

      msg.message = "This message was deleted";
      msg.isDeleted = true;
      await msg.save();

      io.to(msg.roomId).emit("messageUpdated", msg);
    } catch (err) {
      console.error("❌ deleteMessage error:", err);
    }
  });

  /* REACT MESSAGE (store as plain object) */
  socket.on("reactMessage", async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      const reactions: Record<string, string> =
        msg.reactions && typeof msg.reactions === "object" && !(msg.reactions instanceof Map)
          ? (msg.reactions as Record<string, string>)
          : {};

     
      if (reactions[username] === emoji) delete reactions[username];
      else reactions[username] = emoji;

      msg.reactions = reactions as any;
      await msg.save();

      io.to(msg.roomId).emit("messageUpdated", msg);
    } catch (err) {
      console.error("❌ reactMessage error:", err);
    }
  });

  /* DISCONNECT */
  socket.on("disconnect", async () => {
    const set = userSockets.get(username);
    if (set) {
      set.delete(socket.id);

      if (set.size === 0) {
        userSockets.delete(username);

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("userStatusUpdated", {
          username,
          isOnline: false,
          lastSeen: Date.now(),
        });
      }
    }

    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) updateGroupOnlineUsers(roomId);
    }

    console.log("🔴 Disconnected:", username);
  });
});

/* ================= HELPER ================= */

function updateGroupOnlineUsers(roomId: string | string[]) {
  const socketsInRoom =
    io.sockets.adapter.rooms.get(typeof roomId === 'string' ? roomId : roomId[0]) || new Set();

  const onlineUsers = new Set();

  for (const sid of socketsInRoom) {
    for (const [username, socketSet] of userSockets.entries()) {
      if (socketSet.has(sid)) {
        onlineUsers.add(username);
      }
    }
  }

  io.to(roomId).emit("groupOnlineUsers", Array.from(onlineUsers));
}

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server start failed", err);
    process.exit(1);
  }
};

startServer();
