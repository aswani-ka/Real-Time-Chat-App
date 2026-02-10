import api from "@/lib/axios";
import { socket } from "./socket";

export const logout = async () => {
  try {
    
    if (socket.connected) {
      socket.disconnect();
    }
   
    await api.post("/api/auth/logout");

    window.location.href = "/login";
    
  } catch (err) {
    console.error("Logout error:", err);
    window.location.href = "/login";
  }
};
