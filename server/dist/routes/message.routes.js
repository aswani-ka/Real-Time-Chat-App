"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Message_1 = __importDefault(require("../models/Message"));
const router = (0, express_1.Router)();
router.get("/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;
        const messages = await Message_1.default.find({ roomId })
            .sort({ createdAt: 1 })
            .limit(100);
        return res.status(200).json(messages);
    }
    catch (error) {
        console.error("❌ Load messages error:", error);
        return res.status(500).json({ message: "Failed to load messages" });
    }
});
exports.default = router;
