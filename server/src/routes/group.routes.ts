import { Router, Request, Response } from "express";
import Group from "../models/Group";

const router = Router();

/* ================= GET ALL GROUPS ================= */
router.get("/", async (req: Request, res: Response) => {
  try {
    const groups = await Group.find().sort({createdAt: -1});
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({message: "Failed to load groups"});
  }
});

/* ================= CREATE GROUP ================= */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const roomId = `group_${Date.now()}`;

    const group = await Group.create({
      name,
      roomId,
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({message: "Failed to create group"});
  }
});

/* ================= SINGLE GROUP FETCH ================= */
router.get("/:roomId", async (req: Request, res: Response) => {
  try {
    const group = await Group.findOne({
      roomId: req.params.roomId
    })

    if(!group) {
      return res.status(404).json({message: "Group not found"})
    }

    res.json(group)
  } catch (error) {
    res.status(500).json({message: "Failed to load group"})
  }
})

export default router;
