import mongoose from "mongoose";

let isConnected = false;

const LOCAL_URI = "mongodb://127.0.0.1:27017/chatapp";

export default async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    const uri =
      process.env.NODE_ENV === "production"
        ? process.env.MONGO_URI // Atlas on Render
        : (process.env.MONGO_URI || LOCAL_URI); // local by default, but can override

    if (!uri) throw new Error("MONGO_URI is missing");

    // Avoid "already connected" warnings in dev hot reload
    await mongoose.connect(uri);

    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}
