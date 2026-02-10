"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_1 = __importDefault(require("cookie"));
const db_1 = __importDefault(require("./config/db"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const group_routes_1 = __importDefault(require("./routes/group.routes"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const auth_proxy_1 = __importDefault(require("./proxy/auth.proxy"));
const Message_1 = __importDefault(require("./models/Message"));
const chatbot_1 = __importDefault(require("./socket/chatbot"));
const User_1 = __importDefault(require("./models/User"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
/* ================= MIDDLEWARE ================= */
const allowedOrigins = [
    "http://localhost:3000",
    process.env.CLIENT_URL, // your vercel url
].filter((origin) => Boolean(origin));
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
/* ================= SOCKET ================= */
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
/* ================= ROUTES ================= */
app.use("/api/auth", auth_routes_1.default);
app.use("/api/messages", auth_proxy_1.default, message_routes_1.default);
app.use("/api/groups", auth_proxy_1.default, group_routes_1.default);
app.use("/api/users", auth_proxy_1.default, user_route_1.default);
/* ================= ONLINE USER TRACKING ================= */
// username -> Set<socketId>
const userSockets = new Map();
/* ================= SOCKET AUTH ================= */
io.use((socket, next) => {
    try {
        const rawCookie = socket.handshake.headers.cookie;
        if (!rawCookie)
            return next(new Error("No cookies found!"));
        const cookies = cookie_1.default.parse(rawCookie);
        const token = cookies.token;
        if (!token)
            return next(new Error("No token"));
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        socket.data.username = decoded.username;
        socket.data.userId = decoded.userId;
        next();
    }
    catch (err) {
        console.error("Socket auth error:", err);
        next(new Error("Socket authentication failed"));
    }
});
/* ================= SOCKET LOGIC ================= */
io.on("connection", (socket) => {
    const username = socket.data.username;
    const userId = socket.data.userId;
    console.log("🟢 Connected:", username, socket.id);
    if (!userSockets.has(username))
        userSockets.set(username, new Set());
    userSockets.get(username).add(socket.id);
    User_1.default.findByIdAndUpdate(userId, { isOnline: true }).catch(console.error);
    io.emit("userStatusUpdated", { username, isOnline: true });
    /* JOIN ROOM */
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        updateGroupOnlineUsers(roomId);
    });
    /* TYPING */
    socket.on("typing", ({ roomId }) => {
        if (!roomId)
            return;
        socket.to(roomId).emit("userTyping", username); // ✅ string
    });
    socket.on("stopTyping", (roomId) => {
        if (!roomId)
            return;
        socket.to(roomId).emit("userStopTyping"); // ✅ ok
    });
    /* SEND MESSAGE */
    socket.on("sendMessage", async ({ roomId, message }) => {
        try {
            if (!roomId || !(message === null || message === void 0 ? void 0 : message.trim()))
                return;
            const msg = await Message_1.default.create({
                senderName: username, // ✅ must be username string
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
                const reply = await (0, chatbot_1.default)(message);
                const botMsg = await Message_1.default.create({
                    senderName: "Chatbot",
                    receiverName: username,
                    roomId,
                    message: reply,
                    status: "delivered",
                });
                io.to(roomId).emit("receiveMessage", botMsg);
            }
        }
        catch (err) {
            console.error("❌ sendMessage error:", err);
        }
    });
    /* EDIT MESSAGE (only author) */
    socket.on("editMessage", async ({ messageId, newText }) => {
        try {
            const msg = await Message_1.default.findById(messageId);
            if (!msg || msg.isDeleted)
                return;
            if (msg.senderName !== username)
                return;
            msg.message = newText;
            await msg.save();
            io.to(msg.roomId).emit("messageUpdated", msg);
        }
        catch (err) {
            console.error("❌ editMessage error:", err);
        }
    });
    /* DELETE MESSAGE (only author) */
    socket.on("deleteMessage", async (messageId) => {
        try {
            const msg = await Message_1.default.findById(messageId);
            if (!msg)
                return;
            if (msg.senderName !== username)
                return;
            msg.message = "This message was deleted";
            msg.isDeleted = true;
            await msg.save();
            io.to(msg.roomId).emit("messageUpdated", msg);
        }
        catch (err) {
            console.error("❌ deleteMessage error:", err);
        }
    });
    /* REACT MESSAGE (store as plain object) */
    socket.on("reactMessage", async ({ messageId, emoji }) => {
        try {
            const msg = await Message_1.default.findById(messageId);
            if (!msg)
                return;
            const reactions = msg.reactions && typeof msg.reactions === "object" && !(msg.reactions instanceof Map)
                ? msg.reactions
                : {};
            if (reactions[username] === emoji)
                delete reactions[username];
            else
                reactions[username] = emoji;
            msg.reactions = reactions;
            await msg.save();
            io.to(msg.roomId).emit("messageUpdated", msg);
        }
        catch (err) {
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
                await User_1.default.findByIdAndUpdate(userId, {
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
            if (roomId !== socket.id)
                updateGroupOnlineUsers(roomId);
        }
        console.log("🔴 Disconnected:", username);
    });
});
/* ================= HELPER ================= */
function updateGroupOnlineUsers(roomId) {
    const socketsInRoom = io.sockets.adapter.rooms.get(typeof roomId === 'string' ? roomId : roomId[0]) || new Set();
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
        await (0, db_1.default)();
        server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    }
    catch (err) {
        console.error("❌ Server start failed", err);
        process.exit(1);
    }
};
startServer();
