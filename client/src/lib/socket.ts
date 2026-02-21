import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

if (!SOCKET_URL) {
  throw new Error("NEXT_PUBLIC_SOCKET_URL is not defined");
}

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket", "polling"],
});