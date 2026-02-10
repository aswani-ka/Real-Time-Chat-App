"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import ChatListPage from "./ChatListPage";
import api from "@/lib/axios";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/api/auth/me");
      } catch {
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="h-screen flex">
      <aside className="w-[320px]">
        <ChatListPage />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
