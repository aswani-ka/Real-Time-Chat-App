import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const authProxy = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Please login" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };

    (req as any).user = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Unauthorized: Invalid token or expired token" });
  }
};

export default authProxy;
