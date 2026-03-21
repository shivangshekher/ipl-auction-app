import { Response } from "express";
import { RoomType } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";
import { prisma } from "../db";

export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, passcode, teamName } = req.body;
    const adminId = req.user!.id;

    if (!teamName || teamName.trim() === "") {
      res.status(400).json({ message: "Franchise (Team) name is required" });
      return;
    }

    if (type === "PRIVATE" && !passcode) {
      res.status(400).json({ message: "Passcode required for private rooms" });
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = await prisma.room.create({
      data: {
        name,
        code,
        type: type as RoomType,
        passcode: type === "PRIVATE" ? passcode : null,
        adminId,
      },
    });

    await prisma.roomUser.create({
      data: {
        roomId: room.id,
        userId: adminId,
        teamName,
        purseBalance: 100.0,
      },
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: "Server error creating room", error });
  }
};

export const joinRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roomIdOrCode = req.params.roomId as string;
    const { passcode, teamName } = req.body;
    const userId = req.user!.id;

    if (!teamName || teamName.trim() === "") {
      res.status(400).json({ message: "Franchise name is required" });
      return;
    }

    const isCode = roomIdOrCode.length === 6;

    const room = await prisma.room.findFirst({ 
      where: isCode ? { code: roomIdOrCode.toUpperCase() } : { id: roomIdOrCode },
      include: { users: true }
    });

    if (!room) {
      res.status(404).json({ message: "Room not found. Check code." });
      return;
    }

    // Capture the absolute ID for linking
    const roomId = room.id;

    if (room.users.length >= 10) {
      res.status(400).json({ message: "Room is full (Maximum 10 teams)" });
      return;
    }

    if (room.type === "PRIVATE" && room.passcode !== passcode) {
      res.status(401).json({ message: "Invalid passcode" });
      return;
    }

    const existingMember = room.users.find(u => u.userId === userId);

    if (existingMember) {
      res.status(400).json({ message: "Already in room" });
      return;
    }

    const roomUser = await prisma.roomUser.create({
      data: {
        roomId,
        userId,
        teamName,
        purseBalance: 100.0,
      },
    });

    res.status(200).json({ message: "Joined room successfully", roomUser });
  } catch (error) {
    res.status(500).json({ message: "Server error joining room", error });
  }
};

export const getRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const globalRooms = await prisma.room.findMany({
      where: { type: "GLOBAL" },
      include: { _count: { select: { users: true } } },
    });

    const myRooms = await prisma.room.findMany({
      where: {
        users: { some: { userId } },
      },
      include: { _count: { select: { users: true } } },
    });

    res.status(200).json({ globalRooms, myRooms });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching rooms", error });
  }
};

export const getMySquad = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roomId = req.params.roomId as string;
    const userId = req.user!.id;
    
    const squad = await prisma.squad.findMany({
      where: { roomId, userId },
      include: { player: true },
    });
    
    const roomUser = await prisma.roomUser.findUnique({
      where: { roomId_userId: { roomId, userId }}
    });

    res.status(200).json({ squad, purseBalance: roomUser?.purseBalance || 0 });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching squad", error });
  }
};

export const getUpcomingLots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roomId = req.params.roomId as string;

    const availablePlayers = await prisma.$queryRaw<any[]>`
      SELECT p.* FROM "Player" p
      WHERE p.id NOT IN (
        SELECT s."playerId" FROM "Squad" s WHERE s."roomId" = ${roomId}
      )
      ORDER BY 
        p."basePrice" DESC,
        p."name" ASC
    `;

    res.status(200).json({ lots: availablePlayers });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching lots", error });
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roomId = req.params.roomId as string;
    const userId = req.user!.id;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    if (room.adminId !== userId) {
      res.status(403).json({ message: "Only the Matrix Admin can delete this system" });
      return;
    }

    // Nuke relations before deleting room
    await prisma.squad.deleteMany({ where: { roomId } });
    await prisma.roomUser.deleteMany({ where: { roomId } });
    await prisma.room.delete({ where: { id: roomId } });

    res.status(200).json({ message: "Matrix Successfully Dissolved" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting room", error });
  }
};
