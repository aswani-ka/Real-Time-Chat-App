"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Group_1 = __importDefault(require("../models/Group"));
const router = (0, express_1.Router)();
/* ================= GET ALL GROUPS ================= */
router.get("/", async (req, res) => {
    try {
        const groups = await Group_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(groups);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to load groups" });
    }
});
/* ================= CREATE GROUP ================= */
router.post("/", async (req, res) => {
    try {
        const { name } = req.body;
        const roomId = `group_${Date.now()}`;
        const group = await Group_1.default.create({
            name,
            roomId,
        });
        res.status(201).json(group);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create group" });
    }
});
/* ================= SINGLE GROUP FETCH ================= */
router.get("/:roomId", async (req, res) => {
    try {
        const group = await Group_1.default.findOne({
            roomId: req.params.roomId
        });
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        res.json(group);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to load group" });
    }
});
exports.default = router;
