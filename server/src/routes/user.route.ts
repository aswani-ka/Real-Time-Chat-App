import express from "express";
import User from "../models/User";

const router = express.Router();

router.get("/:username/lastseen", async (req, res) => {
  const user = await User.findOne(
    { username: req.params.username },
    { lastSeen: 1, isOnline: 1 }
  );

  if (!user) return res.status(404).json(null);

  res.json(user);
});

export default router;
