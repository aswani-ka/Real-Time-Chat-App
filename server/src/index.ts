import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import jwt from "jsonwebtoken";

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

const CLIENT_URL = "https://real-time-chat-app-six-peach.vercel.app";

app.set("trust proxy", 1);

/* ================= MIDDLEWARE ================= */

app.use(
  cors({
    origin: CLIENT_URL,       
    credentials: true,        
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

/* ================= SOCKET ================= */

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,       
    credentials: true,        
  },
});

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/messages", authProxy, messageRoutes);
app.use("/api/groups", authProxy, groupRoutes);
app.use("/api/users", authProxy, userRoutes);

/* ================= ONLINE USER TRACKING ================= */

// username -> Set<socketId>
const userSockets = new Map<string, Set<string>>();

/* ================= SOCKET AUTH (COOKIE) ================= */

io.use(async (socket, next) => {
  try {
    const raw = socket.handshake.headers.cookie;
    if (!raw) return next(new Error("No cookies"));

    const cookies = cookie.parse(raw);
    const token = cookies.token;
    if (!token) return next(new Error("No token cookie"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // fetch username from DB
    const me = await User.findById(decoded.id).select("name");
    if (!me?.name) return next(new Error("User not found"));

    socket.data.userId = decoded.id;
    socket.data.username = me.name;

    next();
  } catch (err) {
    console.error("Socket auth error:", err);
    next(new Error("Socket auth failed"));
  }
});

/* ================= SOCKET LOGIC ================= */

io.on("connection", (socket) => {
  const myName = socket.data.username as string;
  console.log("🟢 Connected:", myName, socket.id);

  socket.on("userOnline", async () => {
    if (!userSockets.has(myName)) userSockets.set(myName, new Set());
    userSockets.get(myName)!.add(socket.id);

    await User.findOneAndUpdate({ name: myName }, { isOnline: true });

    io.emit("userStatusUpdated", { username: myName, isOnline: true });
  });

  socket.on("joinRoom", (roomId: string) => {
    socket.join(roomId);
    updateGroupOnlineUsers(roomId);
  });

  socket.on("typing", ({ roomId }: { roomId: string }) => {
    socket.to(roomId).emit("userTyping", myName);
  });

  socket.on("stopTyping", (roomId: string) => {
    socket.to(roomId).emit("userStopTyping");
  });

  socket.on("sendMessage", async ({ roomId, message, receiverName }: { roomId: string; message: string; receiverName?: string }) => {
    try {
      if (!roomId || !message?.trim()) return;

      const msg = await Message.create({
        senderName: myName, 
        receiverName: receiverName || "GROUP",
        roomId,
        message,
        status: "sent",
      });

      io.to(roomId).emit("receiveMessage", msg);

      msg.status = "delivered";
      await msg.save();

      io.to(roomId).emit("messageUpdated", msg);

      if (message.startsWith("/bot")) {
        const reply = await chatbot(message);

        const botMsg = await Message.create({
          senderName: "Chatbot",
          receiverName: myName,
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

  socket.on("editMessage", async ({ messageId, newText }: { messageId: string; newText: string }) => {
    const msg = await Message.findById(messageId);
    if (!msg || msg.isDeleted) return;
    if (msg.senderName !== myName) return;

    msg.message = newText;
    await msg.save();
    io.to(msg.roomId).emit("messageUpdated", msg);
  });

  socket.on("deleteMessage", async (messageId: string) => {
    const msg = await Message.findById(messageId);
    if (!msg) return;
    if (msg.senderName !== myName) return;

    msg.message = "This message was deleted";
    msg.isDeleted = true;
    await msg.save();
    io.to(msg.roomId).emit("messageUpdated", msg);
  });

  socket.on("reactMessage", async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
    const msg = await Message.findById(messageId);
    if (!msg) return;

    if (!msg.reactions) msg.reactions = new Map();

    const current = msg.reactions.get(myName);
    if (current === emoji) msg.reactions.delete(myName);
    else msg.reactions.set(myName, emoji);

    await msg.save();
    io.to(msg.roomId).emit("messageUpdated", msg);
  });

  socket.on("disconnect", async () => {
    const sockets = userSockets.get(myName);
    if (sockets) {
      sockets.delete(socket.id);

      if (sockets.size === 0) {
        userSockets.delete(myName);
        await User.findOneAndUpdate({ name: myName }, { isOnline: false, lastSeen: new Date() });

        io.emit("userStatusUpdated", {
          username: myName,
          isOnline: false,
          lastSeen: Date.now(),
        });
      }
    }

    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) updateGroupOnlineUsers(roomId);
    }

    console.log("🔴 Disconnected:", myName);
  });
});

/* ================= HELPER ================= */

function updateGroupOnlineUsers(roomId: string) {
  const socketsInRoom = io.sockets.adapter.rooms.get(roomId) || new Set<string>();
  const onlineUsers = new Set<string>();

  for (const sid of socketsInRoom) {
    for (const [username, socketSet] of userSockets.entries()) {
      if (socketSet.has(sid)) onlineUsers.add(username);
    }
  }

  io.to(roomId).emit("groupOnlineUsers", Array.from(onlineUsers));
}

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

startServer();
