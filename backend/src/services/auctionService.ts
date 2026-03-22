import { redisState } from "../redisClient";
import { Server } from "socket.io";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";

const AUCTION_DURATION_SECONDS = 15;
const BID_RESET_SECONDS = 10;
const auctionTimers = new Map<string, NodeJS.Timeout>();

export const startAuction = async (roomId: string, adminId: string, io: Server) => {
  if (adminId !== "SYSTEM") {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.adminId !== adminId) {
      throw new Error("Unauthorized to start auction");
    }
  }

  const squadCount = await prisma.squad.count({ where: { roomId } });
  const unsoldIds = await redisState.smembers(`room:${roomId}:unsold`);
  const unsoldCount = unsoldIds.length;
  
  const N = squadCount + unsoldCount;
  const positionInCycle = N % 30; // 30 players per full exact logical cycle
  
  let targetPrice = 2.0;
  if (positionInCycle >= 10 && positionInCycle < 20) targetPrice = 1.0;
  else if (positionInCycle >= 20 && positionInCycle < 30) targetPrice = 0.20;

  const unsoldFilter = unsoldIds.length > 0 
    ? Prisma.sql`AND p.id NOT IN (${Prisma.join(unsoldIds)})` 
    : Prisma.sql``;

  // 1. Try to fetch exactly from the mathematically targeted bracket lot sequence
  let availablePlayers = await prisma.$queryRaw<any[]>`
    SELECT p.* FROM "Player" p
    WHERE p."basePrice" = ${targetPrice}
    AND p.id NOT IN (
      SELECT s."playerId" FROM "Squad" s WHERE s."roomId" = ${roomId}
    )
    ${unsoldFilter}
    ORDER BY random()
    LIMIT 1
  `;

  // 2. Fallback protection: If the specific target loop is totally empty, safely grab highest available
  if (!availablePlayers || availablePlayers.length === 0) {
    availablePlayers = await prisma.$queryRaw<any[]>`
      SELECT p.* FROM "Player" p
      WHERE p.id NOT IN (
        SELECT s."playerId" FROM "Squad" s WHERE s."roomId" = ${roomId}
      )
      ${unsoldFilter}
      ORDER BY 
        p."basePrice" DESC,
        random()
      LIMIT 1
    `;
  }

  if (!availablePlayers || availablePlayers.length === 0) {
    throw new Error("No players left to auction");
  }

  const randomPlayer = availablePlayers[0];
  const auctionStateKey = `room:${roomId}:auction`;
  
  await redisState.hmset(auctionStateKey, {
    playerId: randomPlayer.id,
    playerName: randomPlayer.name,
    basePrice: Number(randomPlayer.basePrice),
    highestBid: 0,
    highestBidder: "",
    highestBidderTeam: "",
    status: "ACTIVE"
  });

  const endTime = Date.now() + AUCTION_DURATION_SECONDS * 1000;
  await redisState.hset(auctionStateKey, "endTime", endTime);

  io.to(roomId).emit("auction_started", {
    player: randomPlayer,
    endTime
  });

  if (auctionTimers.has(roomId)) clearTimeout(auctionTimers.get(roomId));
  auctionTimers.set(roomId, setTimeout(() => endAuction(roomId, io), AUCTION_DURATION_SECONDS * 1000));
}

export const placeBid = async (roomId: string, userId: string, io: Server) => {
  const auctionStateKey = `room:${roomId}:auction`;
  const lockKey = `room:${roomId}:auction:lock`;

  const lock = await redisState.set(lockKey, "locked", "PX", 500, "NX");
  if (!lock) throw new Error("Bid in progress, try again");

  try {
    const state = await redisState.hgetall(auctionStateKey);
    if (state.status !== "ACTIVE") throw new Error("Auction is not active");

    const currentHighest = Number(state.highestBid) || 0;
    const basePrice = Number(state.basePrice) || 0;
    
    // 1. Check strict 25 player Roster Cap
    const squadCount = await prisma.squad.count({ where: { roomId, userId } });
    if (squadCount >= 25) {
      io.to(roomId).emit("auction_error", { message: "Roster Cap Reached (25/25). Bid denied." });
      return;
    }

    // Server dynamically calculates next required bid natively (IPL format)
    let nextBidAmount = basePrice;
    if (currentHighest > 0) {
      if (currentHighest < 1.0) nextBidAmount = currentHighest + 0.05;
      else if (currentHighest < 2.0) nextBidAmount = currentHighest + 0.10;
      else if (currentHighest < 3.0) nextBidAmount = currentHighest + 0.20;
      else nextBidAmount = currentHighest + 0.50;
    }

    // Fix precision
    nextBidAmount = Math.round(nextBidAmount * 100) / 100;

    const roomUser = await prisma.roomUser.findUnique({
      where: { roomId_userId: { roomId, userId } }
    });

    // 2. Mathematical Capital Constraint (Minimum 15 Players reserve check)
    const requiredPlayersToHit15 = Math.max(0, 15 - squadCount - 1); // -1 because this current bid counts as 1 player
    const minimumReserveRequired = requiredPlayersToHit15 * 0.20;
    const maxAllowedBid = Number(roomUser?.purseBalance) - minimumReserveRequired;

    if (nextBidAmount > maxAllowedBid) {
      io.to(roomId).emit("auction_error", { message: `Insufficient matrix capital. Reserving ${minimumReserveRequired.toFixed(2)} Cr to reach 15-player minimum.` });
      return;
    }

    if (!roomUser || Number(roomUser.purseBalance) < nextBidAmount) {
      throw new Error(`Insufficient purse balance for bid of ${nextBidAmount} Cr`);
    }

    await redisState.hmset(auctionStateKey, {
      highestBid: nextBidAmount,
      highestBidder: userId,
      highestBidderTeam: roomUser.teamName
    });

    const newEndTime = Date.now() + BID_RESET_SECONDS * 1000;
    await redisState.hset(auctionStateKey, "endTime", newEndTime);
    
    io.to(roomId).emit("new_bid_update", {
      highestBid: nextBidAmount,
      highestBidder: userId,
      highestBidderTeam: roomUser.teamName,
      newEndTime
    });

    if (auctionTimers.has(roomId)) clearTimeout(auctionTimers.get(roomId));
    auctionTimers.set(roomId, setTimeout(() => endAuction(roomId, io), BID_RESET_SECONDS * 1000));
  } finally {
    await redisState.del(lockKey);
  }
}

export const endAuction = async (roomId: string, io: Server) => {
  if (auctionTimers.has(roomId)) {
    clearTimeout(auctionTimers.get(roomId));
    auctionTimers.delete(roomId);
  }

  const auctionStateKey = `room:${roomId}:auction`;
  const state = await redisState.hgetall(auctionStateKey);

  if (state.status !== "ACTIVE") return;

  await redisState.hset(auctionStateKey, "status", "ENDED");

  if (state.highestBidder && state.highestBidder !== "") {
    await prisma.$transaction(async (tx: any) => {
      await tx.roomUser.update({
        where: { roomId_userId: { roomId, userId: state.highestBidder } },
        data: { purseBalance: { decrement: Number(state.highestBid) } }
      });
      await tx.squad.create({
        data: {
          roomId,
          userId: state.highestBidder,
          playerId: state.playerId,
          boughtFor: Number(state.highestBid)
        }
      });
    });

    io.to(roomId).emit("auction_ended", {
      status: "SOLD",
      player: state.playerName,
      soldTo: state.highestBidder,
      soldToTeam: state.highestBidderTeam,
      amount: state.highestBid
    });
  } else {
    // Write unsold isolation constraint memory hook directly to Redis
    await redisState.sadd(`room:${roomId}:unsold`, state.playerId);

    io.to(roomId).emit("auction_ended", {
      status: "UNSOLD",
      player: state.playerName
    });
  }

  // Launch Autonomous System Auctioneer (Wait 6 seconds for participants to see result)
  setTimeout(async () => {
    try {
      await startAuction(roomId, "SYSTEM", io);
    } catch (error: any) {
      if (error.message === "No players left to auction") {
        io.to(roomId).emit("auction_finished", { message: "Mega Auction Concluded! All Lots cleared." });
      } else {
        console.error("Auto-Auction Error:", error);
      }
    }
  }, 6000);
}
