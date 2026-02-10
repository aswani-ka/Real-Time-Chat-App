"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Lock, ArrowLeft } from "lucide-react";

/* ================= CONFIG ================= */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ================= COMPONENT ================= */

export default function ResetPassword() {
  const { token } = useParams();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");

    if (password !== confirmPassword)
      return toast.error("Passwords do not match");

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/auth/reset-password/${token}`,
        { password },
        { withCredentials: true }
      );
      toast.success("Password reset successful 🔐");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Reset link expired or invalid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 text-white">

      <div className="w-full max-w-sm md:max-w-md bg-[#020617] border border-white/10 rounded-2xl shadow-2xl p-8">

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
            Reset password
          </h1>
          <p className="text-gray-500 mt-1">
            Create a new secure password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-6">
          {/* New password */}
          <div>
            <label className="text-sm text-gray-400">
              New password
            </label>

            <div className="relative mt-1">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type={showNew ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-10 py-2 pr-10 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="text-sm text-gray-400">
              Confirm password
            </label>

            <div className="relative mt-1">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-10 py-2 pr-10 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
