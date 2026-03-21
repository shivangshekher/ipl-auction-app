import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { startAuction, placeBid } from "./services/auctionService";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token provided"));
    
    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
      if (err) return next(new Error("Invalid token"));
      (socket as any).userId = decoded.id;
      next();
    });
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId;

    socket.on("join_room", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on("start_auction", async (data) => {
      const { roomId } = data;
      try {
        await startAuction(roomId, userId, io);
      } catch (err: any) {
        socket.emit("auction_error", { message: err.message });
      }
    });

    socket.on("place_bid", async (data) => {
      const { roomId } = data;
      try {
        await placeBid(roomId, userId, io);
      } catch (err: any) {
        socket.emit("auction_error", { message: err.message });
      }
    });
  });

  return io;
};
