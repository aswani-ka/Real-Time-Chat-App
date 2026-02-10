import axios from "axios";
import { socket } from "./socket";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const logout = async () => {
  try {
    
    if (socket.connected) {
      socket.disconnect();
    }

    await axios.post(
      `${API_URL}/api/auth/logout`,
      {},
      { withCredentials: true }
    );

    window.location.href = "/login";

  } catch (err) {
    console.error("Logout error:", err);

    window.location.href = "/login";
  }
};
