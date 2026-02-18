import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://real-time-chat-app-j2w5.onrender.com",
  withCredentials: true,
});

export default api;
