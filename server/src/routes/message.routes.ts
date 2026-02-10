import { Request, Response, Router } from "express";
import Message from "../models/Message";

const router = Router();

router.get("/:roomId", async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(100);

    return res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Load messages error:", error);
    return res.status(500).json({ message: "Failed to load messages" });
  }
});

export default router;
