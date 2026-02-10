"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });

      toast.success("Welcome back 👋");
      router.push("/chat");
    } catch(error: any) {
      toast.error(error.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">

      {/* ================= CARD ================= */}
      <div className="w-full max-w-sm md:max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 text-white">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col items-center mb-6">
          <Link href="/">
            <div className="flex items-center gap-2 text-xl font-bold mb-5">
              <MessageSquare className="text-indigo-400" />
              ChatFlow
            </div>
          </Link>

          <h1 className="text-2xl font-semibold">
            Welcome back 😊
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Login to continue chatting
          </p>
        </div>

        {/* ================= FORM ================= */}
        <form onSubmit={submit} className="space-y-4" noValidate>

          {/* Email */}
          <div>
            <label className="text-xs text-gray-400">
              Email Address
            </label>
            <input
              type="email"
              placeholder="john@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-[#020617] border border-white/10 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-gray-400">
              Password
            </label>

            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 pr-10 rounded-lg bg-[#020617] border border-white/10 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 transition rounded-xl py-2 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2
                  className="animate-spin"
                  size={18}
                />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* ================= FOOTER ================= */}
        <div className="flex justify-between items-center mt-6 text-sm text-gray-400">
          <span
            onClick={() =>
              router.push("/forgot-password")
            }
            className="cursor-pointer hover:text-indigo-400"
          >
            Forgot password?
          </span>

          <span>
            New here?{" "}
            <span
              onClick={() => router.push("/signup")}
              className="text-indigo-400 cursor-pointer hover:underline"
            >
              Create account
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
