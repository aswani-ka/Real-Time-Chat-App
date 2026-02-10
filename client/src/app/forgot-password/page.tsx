"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

/* ================= CONFIG ================= */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ================= COMPONENT ================= */

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/auth/forgot-password`,
        { email },
        { withCredentials: true }
      );
      toast.success("Reset link sent to your email 📧");
      setEmail("");
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error("Email not found");
      } else {
        toast.error("Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 text-white">

      <div className="w-full max-w-sm md:max-w-md bg-[#0a0a22] border border-white/10 rounded-2xl shadow-2xl p-10">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>

          <h1 className="text-2xl font-bold">
            Forgot password?
          </h1>
          <p className="text-gray-500 mt-3">
            We’ll send you a reset link
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-6" noValidate>
          <div>
            <label className="text-sm text-gray-400">
              Email address
            </label>

            <div className="relative mt-2">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                placeholder="you@example.com"
                disabled={loading}
                required
                className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-10 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 transition py-2 rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
