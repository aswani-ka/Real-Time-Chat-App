"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { io, Socket } from "socket.io-client";
import { Pencil, Trash2, Smile, LogOut } from "lucide-react";

/* ================= TYPES ================= */

interface Message {
  _id?: string;
  senderName: string;
  receiverName?: string;
  roomId: string;
  message: string;
  status?: "sent" | "delivered" | "seen";
  isDeleted?: boolean;
  reactions?: { [username: string]: string };
  createdAt?: string;
}

const EMOJIS = ["👍", "❤️", "😂", "😮"];

/* ================= COMPONENT ================= */

export default function PrivateChat() {
  const params = useParams();
  const usernameParam = (params as any)?.username;
  const receiver = decodeURIComponent(
    Array.isArray(usernameParam) ? usernameParam[0] : usernameParam
  );


  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const roomId =
    user && receiver ? [user, receiver].sort().join("_") : "";

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setUser(res.data.user.username);
      } catch {
        window.location.href = "/login";
      }
    };
    loadMe();
  }, []);


  /* ================= LOAD HISTORY ================= */
  useEffect(() => {
  if (!roomId) return;

  api
    .get(`/api/messages/${roomId}`)
    .then((res) => setMessages(res.data || []))
    .catch((err) => {
      console.log("❌ load messages error:", err.response?.status, err.response?.data);
      console.error("Failed to load messages");
    });
  }, [roomId]);

  useEffect(() => {
    if(!roomId) return
    socketRef.current?.emit("markSeen", {roomId})
  }, [roomId, messages.length])


  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!user || !roomId) return;

    const init = async () => {
      try {
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
          socket.emit("getUserStatus", receiver);
          socket.emit("markSeen", { roomId})
        });

        socket.on("receiveMessage", (msg: Message) => setMessages((prev) => [...prev, msg]));

        socket.on("messageUpdated", (updatedMsg: Message) => {
          setMessages((prev) => prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m)));
        });

        socket.on("userTyping", setTypingUser);
        socket.on("userStopTyping", () => setTypingUser(null));

        socket.on("userStatusUpdated", (data) => {
          if (data.username !== receiver) return;
          if (data.isOnline) setLastSeen("Online");
          else if (data.lastSeen) setLastSeen(formatLastSeen(data.lastSeen));
        });

        } catch {
          window.location.href = "/login";
        }
      };

      init();

      return () => {
        socketRef.current?.disconnect();
      };
    }, [user,roomId, receiver]);


    /* ================= HELPERS ================= */
    const formatLastSeen = (time: number) => {
      if (!time) return "";
      const diff = Math.floor((Date.now() - time) / 1000);
      if (diff < 60) return "Last seen just now";
      if (diff < 3600) return `Last seen ${Math.floor(diff / 60)} min ago`;
      if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)} hr ago`;
      return `Last seen ${Math.floor(diff / 86400)} days ago`;
    };

    const sendMessage = () => {
      if (!text.trim() || !user) return;

      socketRef.current?.emit("sendMessage", {
        chatType: "PRIVATE",
        roomId,
        message: text,
        receiverName: receiver,
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

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ================= UI ================= */
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-purple-50">

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow rounded-b-2xl">
          <div className="flex justify-center items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  👤
            </div>
            <div className="flex flex-col">
              <h2 className="font-semibold text-lg">{receiver}</h2>
              {lastSeen && (
                <p className="text-xs opacity-80">{lastSeen}</p>
              )}
            </div>
          </div>
        </div>

        {/* ================= MESSAGES ================= */}
        <div className="flex-1 overflow-y-auto px-12 py-4 space-y-7">
          {messages.map((msg, i) => {
            const isMe = msg.senderName === user;

            return (
              <div
                key={msg._id || i}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className="relative group max-w-[70%]">

                  {/* MESSAGE BUBBLE */}
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                      isMe
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-md"
                        : "bg-white text-indigo-500 rounded-bl-md"
                    }`}
                  >
                    {editingId === msg._id ? (
                      <div className="flex gap-2">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="px-2 py-1 rounded text-gray-800 text-sm"
                        />
                        <button
                          onClick={saveEdit}
                          className="text-xs text-green-500"
                        >
                          Save
                        </button>
                      </div>
                    ) : msg.isDeleted ? (
                      <i className="opacity-60 text-sm">
                        This message was deleted
                      </i>
                    ) : (
                      msg.message
                    )}

                    {/* STATUS */}
                    {isMe && (
                      <p className="text-[10px] text-right opacity-70 mt-1">
                        {msg.status === "seen"
                          ? "✓✓ Seen"
                          : msg.status === "delivered"
                          ? "✓✓ Delivered"
                          : "✓ Sent"}
                      </p>
                    )}
                  </div>

                  {/* ACTIONS */}
                  {isMe && !msg.isDeleted && (
                    <div className="
                      absolute -top-9 right-0
                      flex gap-1 bg-white rounded-full shadow px-2 py-1
                      opacity-0 group-hover:opacity-100 transition
                    ">
                      <button
                        onClick={() => startEdit(msg)}
                        className="text-indigo-500 hover:bg-indigo-50 p-1 rounded"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteMsg(msg._id!)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {/* EMOJI REACTIONS */}
                  <div className="
                    absolute -bottom-8 -left-5
                    flex gap-1 bg-white rounded-full shadow px-2 py-1
                    opacity-0 group-hover:opacity-100 transition
                  ">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => reactToMessage(msg._id!, emoji)}
                        className="hover:scale-125 transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* DISPLAY REACTIONS */}
                  {msg.reactions && (
                    <div className="flex gap-1 mt-1 text-xs">
                      {Object.values(msg.reactions).map((r, i) => (
                        <span key={i}>{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* ================= TYPING ================= */}
        {typingUser && typingUser !== user && (
          <p className="px-6 pb-1 text-sm italic text-gray-500">
            {typingUser} is typing...
          </p>
        )}

        {/* ================= INPUT ================= */}
        <div className="px-6 py-3 bg-white flex items-center gap-3">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              socketRef.current?.emit("typing", {
                roomId,
                username: user,
              });
              setTimeout(
                () => socketRef.current?.emit("stopTyping", roomId),
                800
              );
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message"
            className="
              flex-1 px-4 py-2 rounded-full border border-gray-600
              focus:outline-none focus:ring-2 focus:ring-indigo-400
            "
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="
              bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2 rounded-full transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
      </div>
    )
};
