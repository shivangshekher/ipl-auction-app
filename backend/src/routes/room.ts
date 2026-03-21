import express from "express";
import { createRoom, joinRoom, getRooms, getMySquad, getUpcomingLots, deleteRoom } from "../controllers/roomController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", protect, createRoom);
router.get("/", protect, getRooms);
router.post("/:roomId/join", protect, joinRoom);
router.get("/:roomId/squad", protect, getMySquad);
router.get("/:roomId/lots", protect, getUpcomingLots);
router.delete("/:roomId", protect, deleteRoom);

export default router;
