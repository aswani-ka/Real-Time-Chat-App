"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
router.get("/:username/lastseen", async (req, res) => {
    const user = await User_1.default.findOne({ username: req.params.username }, { lastSeen: 1, isOnline: 1 });
    if (!user)
        return res.status(404).json(null);
    res.json(user);
});
exports.default = router;
