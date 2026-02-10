"use client";

import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Lock,
  Users,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">

      {/* ================= NAVBAR ================= */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xl font-bold">
          <MessageSquare className="text-indigo-400" />
          ChatFlow
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold transition cursor-pointer"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="max-w-6xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-16 items-center">

        {/* LEFT */}
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs mb-6">
            <Sparkles size={14} />
            Real-time Chat Platform
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Conversations that <br />
            <span className="text-indigo-400">feel instant.</span>
          </h1>

          <p className="mt-6 text-gray-300 max-w-md">
            ChatFlow lets you connect instantly with private chats,
            group conversations, live typing indicators, reactions,
            and secure messaging — all in real time.
          </p>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => router.push("/signup")}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold transition cursor-pointer"
            >
              Start Chatting
            </button>

            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition cursor-pointer"
            >
              Login
            </button>
          </div>
        </div>

        {/* RIGHT – MOCK CHAT UI */}
        <div className="hidden md:block">
          <div className="bg-[#020617] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="px-3 py-2 rounded-lg bg-gray-800">
                  Hey! Are you online?
                </span>
              </div>

              <div className="flex justify-end">
                <span className="px-3 py-2 rounded-lg bg-indigo-600">
                  Yes! Just joined 🚀
                </span>
              </div>

              <div className="flex gap-2">
                <span className="px-3 py-2 rounded-lg bg-gray-800">
                  Group chat is live now 👥
                </span>
              </div>

              <p className="text-xs text-gray-400 italic">
                typing...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="bg-[#020617] py-18 px-8">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">

          <Feature
            icon={<MessageSquare />}
            title="Live Messaging"
            desc="Instant delivery using WebSockets with read receipts and typing indicators."
          />

          <Feature
            icon={<Users />}
            title="Private & Groups"
            desc="Chat one-to-one or create groups with online status tracking."
          />

          <Feature
            icon={<Lock />}
            title="Secure by Design"
            desc="JWT-based authentication with protected APIs."
          />
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="text-center py-4 text-sm text-gray-400">
        © {new Date().getFullYear()} ChatFlow • Built for real-time conversations
      </footer>
    </div>
  );
}

/* ================= FEATURE COMPONENT ================= */

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 hover:border-indigo-500/40 transition">
      <div className="text-indigo-400 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}
