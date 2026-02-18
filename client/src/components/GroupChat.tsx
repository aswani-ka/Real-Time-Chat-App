"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Trash2, LogOut } from "lucide-react";
import api from "@/lib/axios";


/* ================= TYPES ================= */

interface Message {
  _id?: string;
  senderName: string;
  message: string;
  status?: "sent" | "delivered" | "seen";
  isDeleted?: boolean;
  reactions?: { [username: string]: string };
}

/* ================= CONFIG ================= */

const EMOJIS = ["👍", "❤️", "😂", "😮"];

/* ================= COMPONENT ================= */

export default function GroupChat() {
  const params = useParams();
  const router = useRouter();

  const roomIdParam = (params as any)?.roomId;
  const roomId = Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam;

  const [groupName, setGroupName] = useState("Group Chat")
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<string | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);


  /* ================= LOAD GROUP NAME ================= */

  useEffect(() => {
  if (!roomId) return;

  const loadGroup = async () => {
    try {
      const res = await api.get(`/api/groups/${roomId}`);
      setGroupName(res.data.name);
    } catch {
      setGroupName("Group Chat");
    }
  };

  loadGroup();
}, [roomId]);


  /* ================= AUTH + USER ================= */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setUser(res.data.user.username); 
      } catch {
        router.replace("/login");
      }
    };
    loadUser();
  }, [router]);


  /* ================= LOAD HISTORY ================= */
  useEffect(() => {
    if (!roomId) return;

    const loadMessages = async () => {
      try {
        const res = await api.get(`/api/messages/${roomId}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadMessages();
  }, [roomId]);

  /* ================= SOCKET ================= */
 useEffect(() => {
  if (!user || !roomId) return;

  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";

  const socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["polling", "websocket"],
  });

  socketRef.current = socket;

  socket.on("connect", () => {
    socket.emit("joinRoom", roomId);
  });

  socket.on("groupOnlineUsers", (users: string[]) => setOnlineUsers(users));
  socket.on("receiveMessage", (msg: Message) => setMessages((prev) => [...prev, msg]));
  socket.on("messageUpdated", (msg: Message) =>
    setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)))
  );

  socket.on("userTyping", setTypingUser);
  socket.on("userStopTyping", () => setTypingUser(null));

  return () => {
    socket.disconnect();
  }
}, [user, roomId]);


  /* ================= SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= ACTIONS ================= */
  const sendMessage = () => {
    if (!text.trim()) return;

    socketRef.current?.emit("sendMessage", {
      roomId,
      message: text,
    });

    setText("");
  };

  const startEdit = (msg: Message) => {
    if (msg.isDeleted) return;
    setEditingId(msg._id!);
    setEditText(msg.message);
  };

  const saveEdit = () => {
    socketRef.current?.emit("editMessage", {
      messageId: editingId,
      newText: editText,
    });
    setEditingId(null);
  };

  const deleteMsg = (id: string) => {
    socketRef.current?.emit("deleteMessage", id);
  };

  const reactToMessage = (id: string, emoji: string) => {
    socketRef.current?.emit("reactMessage", {
      messageId: id,
      emoji, 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow rounded-b-2xl">
        <div className="flex flex-col justify-between items-center gap-3">
            <div className="flex gap-2 justify-center items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                👥
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">{groupName}</h2>
                <p className="text-sm opacity-80">
                {onlineUsers.length > 0 ? `${onlineUsers.length} online` : ""}
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {onlineUsers
                .filter((u) => u !== user)
                .map((u) => (
                  <span key={u} className="text-xs bg-white/20 px-3 py-1 rounded-full">
                    🟢 {u}
                  </span>
                ))}
            </div>
        </div>

        
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-12 py-4 space-y-7">
        {messages.map((msg, i) => {
          const isMe = msg.senderName === user;

          return (
            <div
              key={msg._id || i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className="relative group max-w-[70%]">
                <div
                  className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    isMe
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-md"
                      : "bg-white text-gray-700 rounded-bl-md"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-semibold text-indigo-600 mb-1">
                      {msg.senderName}
                    </p>
                  )}

                  {editingId === msg._id ? (
                    <div className="flex gap-2">
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="px-2 py-1 rounded text-gray-800 text-sm"
                      />
                      <button onClick={saveEdit} className="text-xs text-green-500">
                        Save
                      </button>
                    </div>
                  ) : msg.isDeleted ? (
                    <i className="opacity-60 text-sm">This message was deleted</i>
                  ) : (
                    msg.message
                  )}
                </div>

                {isMe && !msg.isDeleted && (
                  <div className="absolute -top-9 right-0 flex gap-1 bg-white rounded-full shadow px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => startEdit(msg)} className="text-indigo-500 p-1">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteMsg(msg._id!)} className="text-red-500 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="absolute -bottom-8 -left-10 flex gap-1 bg-white rounded-full shadow px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  {EMOJIS.map((emoji) => (
                    <button key={emoji} onClick={() => reactToMessage(msg._id!, emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>

                {msg.reactions && (
                  <div className="flex gap-1 mt-1 text-xs">
                    {Object.values(msg.reactions).map((r, idx) => (
                      <span key={idx}>{r}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* TYPING */}
      {typingUser && typingUser !== user && (
        <p className="px-6 pb-1 text-sm italic text-gray-500">{typingUser} is typing...</p>
      )}

      {/* INPUT */}
      <div className="p-4 bg-white flex gap-2">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            socketRef.current?.emit("typing", { roomId }); 
            setTimeout(() => socketRef.current?.emit("stopTyping", roomId), 800);
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 border border-gray-600 rounded-full px-4 py-2"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
