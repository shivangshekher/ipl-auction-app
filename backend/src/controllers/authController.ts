import { Request, Response } from "express";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken";
import { prisma } from "../db";

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, phone, password } = req.body;

    const userExists = await prisma.user.findFirst({
      where: { OR: [{ phone }, { username }] },
    });

    if (userExists) {
      res.status(400).json({ message: "User with this phone or username already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { username, phone, passwordHash },
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      phone: user.phone,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.status(200).json({
        id: user.id,
        username: user.username,
        phone: user.phone,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: "Invalid phone number or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error });
  }
};
