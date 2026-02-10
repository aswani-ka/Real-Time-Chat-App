import axios from "axios";
import { socket } from "./socket";

export const logout = async () => {
  try {
    
    if (socket.connected) {
      socket.disconnect();
    }

    await axios.post(
      "http://localhost:5000/api/auth/logout",
      {},
      { withCredentials: true }
    );

    window.location.href = "/login";

  } catch (err) {
    console.error("Logout error:", err);

    window.location.href = "/login";
  }
};
