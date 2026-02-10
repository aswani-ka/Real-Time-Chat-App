import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User"
import { sendResetPasswordMail } from "../helpers/mailer"
import { Request, Response, Router } from "express"
import authProxy from "../proxy/auth.proxy"
import crypto from "crypto"



const router = Router()

router.post("/signup", async (req: Request, res: Response) => {
    try {
        const {name, email, password} = req.body

        if(!name || !email || !password) {
            return res.status(400).json({message: "All fields are required"})
        }

        const existingUser = await User.findOne({email})
        if(existingUser) {
            return res.status(400).json({message: "User already exists"})
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await User.create({
            name,
            email,
            password: hashedPassword
        })

        return res.status(200).json({message: "User registered"})

    } catch (error) {
        console.error("Sign Up error: ", error);
        return res.status(500).json({message: "Sign Up failed"})
    }
})




router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

  
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.name, 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login success",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error: ", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    await sendResetPasswordMail(
      user.email,
      user.name,
      resetLink
    );

    return res.json({ message: "Reset link sent to email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Error sending reset link" });
  }
});

router.post("/reset-password/:token", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to reset password" });
    }
});


router.get("/users", authProxy, async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, "name email");
    res.json(
      users.map((u) => ({
        id: u._id,
        username: u.name,
        email: u.email,
      }))
    );
  } catch (error) {
    console.error("Load users error:", error);
    res.status(500).json({ message: "Failed to load users" });
  }
})

router.get("/me", authProxy, async (req, res) => {
  try {
    return res.status(200).json({
      user: (req as any).user, 
    });
  } catch (error) {
    console.error("Auth check failed:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
});

router.post("/logout", async (_req: Request, res: Response) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "Logout failed",
    });
  }
});


export default router