import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SECRET, USERS } from "../data";

export function usermiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization || req.cookies?.Authorization;
  if (!token) {
    return res.status(403).json({ message: "Incorrect credentials" });
  }

  try {
    const decoded = jwt.verify(token, SECRET) as { userId: string };
    //@ts-ignore
    req.userId = decoded.userId;

    if (!USERS[decoded.userId]) {
      return res.status(403).json({ message: "Incorrect credentials" });
    }
    next();
  } catch {
    return res.status(403).json({ message: "Incorrect credentials" });
  }
}
