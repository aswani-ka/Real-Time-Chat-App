"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await api.post("/api/auth/signup", form);

      toast.success("Account created successfully 🎉");
      router.push("/login");
    } catch (error: any) {
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
            Create your account ☺️
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Start chatting in real time
          </p>
        </div>

        {/* ================= FORM ================= */}
        <form onSubmit={submit} className="space-y-4" noValidate>

          {/* Name */}
          <div>
            <label className="text-xs text-gray-400">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-[#020617] border border-white/10 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-gray-400">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="john@email.com"
              onChange={handleChange}
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
                name="password"
                placeholder="••••••••"
                onChange={handleChange}
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                <Loader2 className="animate-spin" size={18} />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* ================= FOOTER ================= */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-indigo-400 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
