"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const mailer_1 = require("../helpers/mailer");
const express_1 = require("express");
const auth_proxy_1 = __importDefault(require("../proxy/auth.proxy"));
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await User_1.default.create({
            name,
            email,
            password: hashedPassword
        });
        return res.status(200).json({ message: "User registered" });
    }
    catch (error) {
        console.error("Sign Up error: ", error);
        return res.status(500).json({ message: "Sign Up failed" });
    }
});
router.post("/login", async (req, res) => {
    try {
        const isProd = process.env.NODE_ENV === "production";
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Email and password are required" });
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const ok = await bcryptjs_1.default.compare(password, user.password);
        if (!ok)
            return res.status(400).json({ message: "Invalid credentials" });
        const token = jsonwebtoken_1.default.sign({
            userId: user._id.toString(),
            username: user.name,
        }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: isProd ? "none" : "lax",
            secure: isProd,
            maxAge: 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            message: "Login success",
            user: { id: user._id, name: user.name, email: user.email },
        });
    }
    catch (error) {
        console.error("Login error: ", error);
        return res.status(500).json({ message: "Login failed" });
    }
});
router.post("/forgot-password", async (req, res) => {
    var _a;
    try {
        const email = (_a = req.body.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const token = crypto_1.default.randomBytes(32).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        const resetLink = `http://localhost:3000/reset-password/${token}`;
        await (0, mailer_1.sendResetPasswordMail)(user.email, user.name, resetLink);
        return res.json({ message: "Reset link sent to email" });
    }
    catch (err) {
        console.error("Forgot password error:", err);
        return res.status(500).json({ message: "Error sending reset link" });
    }
});
router.post("/reset-password/:token", async (req, res) => {
    try {
        const { password } = req.body;
        const { token } = req.params;
        const user = await User_1.default.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() },
        });
        if (!user)
            return res.status(400).json({ message: "Invalid or expired token" });
        user.password = await bcryptjs_1.default.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();
        res.json({ message: "Password reset successful" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to reset password" });
    }
});
router.get("/users", auth_proxy_1.default, async (req, res) => {
    try {
        const users = await User_1.default.find({}, "name email");
        res.json(users.map((u) => ({
            id: u._id,
            username: u.name,
            email: u.email,
        })));
    }
    catch (error) {
        console.error("Load users error:", error);
        res.status(500).json({ message: "Failed to load users" });
    }
});
router.get("/me", auth_proxy_1.default, async (req, res) => {
    try {
        return res.status(200).json({
            user: req.user,
        });
    }
    catch (error) {
        console.error("Auth check failed:", error);
        return res.status(401).json({ message: "Unauthorized" });
    }
});
router.post("/logout", async (_req, res) => {
    try {
        const isProd = process.env.NODE_ENV === "production";
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: isProd ? "none" : "lax",
            secure: isProd,
        });
        return res.status(200).json({
            message: "Logged out successfully",
        });
    }
    catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            message: "Logout failed",
        });
    }
});
exports.default = router;
