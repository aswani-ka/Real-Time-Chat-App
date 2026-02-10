"use client"

import { useEffect, type ReactNode } from "react";
import ChatListPage from "./ChatListPage";
import axios from "axios";
import { useRouter } from "next/navigation";




export default function ChatLayout({ children }: { children: ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(
          "http://localhost:5000/api/auth/me",
          { withCredentials: true }
        );
        
      } catch (error) {
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
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
