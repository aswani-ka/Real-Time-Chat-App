"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { logout } from "@/lib/logout";
import {
  Plus,
  Users,
  MessageCircle,
  User2,
  LogOut,
} from "lucide-react";
import api from "@/lib/axios";

/* ================= TYPES ================= */

interface Group {
  _id: string;
  name: string;
  roomId: string;
}

/* ================= COMPONENT ================= */

export default function ChatListPage() {
  const router = useRouter();

  type UserItem = { id: string; username: string; email: string };

  const [users, setUsers] = useState<UserItem[]>([]);

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupName, setGroupName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("");

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setCurrentUser(res.data.user.username);
      } catch {
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
  if (!currentUser) return;

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/api/auth/users");

      const list: UserItem[] = res.data || [];

      setUsers(list.filter((u) => u.username !== currentUser));
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  loadUsers();
}, [currentUser]);


  /* ================= LOAD GROUPS ================= */
  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      try {
        const res = await api.get("/api/groups");
        setGroups(res.data || []);
      } catch {
        toast.error("Failed to load groups");
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, []);

  /* ================= CREATE GROUP ================= */
  const createGroup = async () => {
    if (!groupName.trim()) return;

    try {
      const res = await api.post("/api/groups", {
        name: groupName.trim(),
      });

      setGroups((prev) => [res.data, ...prev]);
      setGroupName("");
      setShowCreate(false);
      toast.success("Group created");
    } catch {
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="min-h-screen bg-[#202e50] text-white flex">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-full md:w-80 border-r border-white/10 bg-[#020617] p-4 flex flex-col">

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageCircle className="text-indigo-400" />
            Chats
          </h1>
          {/* ================= GROUPS ================= */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-widest text-gray-400">
                GROUPS
              </p>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="p-1 rounded hover:bg-white/10 transition"
              >
                <Plus size={16} />
              </button>
            </div>
            {showCreate && (
              <div className="flex gap-2 mb-4">
                <input
                  value={groupName}
                  onChange={(e) =>
                    setGroupName(e.target.value)
                  }
                  placeholder="Group name"
                  className="flex-1 bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={createGroup}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-medium"
                >
                  Create
                </button>
              </div>
            )}
            {loadingGroups && (
              <p className="text-sm text-gray-500">
                Loading groups...
              </p>
            )}
            {!loadingGroups && groups.length === 0 && (
              <p className="text-sm text-gray-500">
                No groups yet
              </p>
            )}
            <div className="space-y-1">
              {groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() =>
                    router.push(`/chat/group/${group.roomId}`)
                  }
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
                >
                  <Users size={25} className="text-indigo-400" />
                  <span className="text-sm">
                    {group.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
          {/* ================= DIRECT MESSAGES ================= */}
          <section>
            <p className="text-xs tracking-widest text-gray-400 mb-3">
              DIRECT MESSAGES
            </p>
            {loadingUsers && (
              <p className="text-sm text-gray-500">
                Loading users...
              </p>
            )}
            {!loadingUsers && users.length === 0 && (
              <p className="text-sm text-gray-500">
                No users available
              </p>
            )}
            <div className="space-y-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => router.push(`/chat/${encodeURIComponent(u.username)}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
                >
                  <User2 size={25} className="text-emerald-400" />
                  <span className="text-sm">{u.username}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition h-fit cursor-pointer"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>
    </div>
  );
}
