import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireOfficer } from "../middleware/authMiddleware.js";
import {
  getMeetingRoomParticipantCount,
  joinMeetingRoomSession,
  leaveMeetingRoom,
  pollMeetingRoomSession,
  sendMeetingSignal,
  touchMeetingParticipant,
} from "../services/meetingRoomService.js";
import {
  createPersistentMeetingRoom,
  deletePersistentMeetingRoom,
  getPersistentMeetingRoom,
  getPersistentMeetingRoomAttendance,
  listPersistentMeetingRooms,
} from "../services/meetingRoomPersistenceService.js";

export const meetingRoomRouter = Router();

function singleValue(value: unknown) {
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

meetingRoomRouter.post(
  "/create",
  requireOfficer,
  asyncHandler(async (req, res) => {
    const room = await createPersistentMeetingRoom({
      title: String(req.body.title || ""),
      hostName: String(req.body.hostName || ""),
    });

    res.status(201).json({ room });
  }),
);

meetingRoomRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rooms = await listPersistentMeetingRooms();
    res.json({ rooms });
  }),
);

meetingRoomRouter.get(
  "/:roomId",
  asyncHandler(async (req, res) => {
    const roomId = singleValue(req.params.roomId);
    const room = await getPersistentMeetingRoom(roomId, await getMeetingRoomParticipantCount(roomId));
    if (!room) {
      res.status(404).json({ message: "Meeting room not found." });
      return;
    }

    res.json({ room });
  }),
);

meetingRoomRouter.get(
  "/:roomId/attendance",
  asyncHandler(async (req, res) => {
    const roomId = singleValue(req.params.roomId);
    const attendance = await getPersistentMeetingRoomAttendance(roomId);
    if (!attendance) {
      res.status(404).json({ message: "Meeting room not found." });
      return;
    }

    res.json(attendance);
  }),
);

meetingRoomRouter.delete(
  "/:roomId",
  requireOfficer,
  asyncHandler(async (req, res) => {
    const result = await deletePersistentMeetingRoom(singleValue(req.params.roomId));
    res.json(result);
  }),
);

meetingRoomRouter.post(
  "/:roomId/join",
  asyncHandler(async (req, res) => {
    const roomId = singleValue(req.params.roomId);
    const participantCount = await getMeetingRoomParticipantCount(roomId);
    const roomInfo = await getPersistentMeetingRoom(roomId, participantCount);
    if (!roomInfo) {
      res.status(404).json({ message: "Meeting room not found." });
      return;
    }

    const room = await joinMeetingRoomSession({
      roomId,
      peerId: String(req.body.peerId || ""),
      name: String(req.body.name || ""),
      email: String(req.body.email || ""),
    });
    const updatedRoomInfo = await getPersistentMeetingRoom(roomId, await getMeetingRoomParticipantCount(roomId));
    res.json({ room: updatedRoomInfo ?? roomInfo, ...room });
  }),
);

meetingRoomRouter.get(
  "/:roomId/poll",
  asyncHandler(async (req, res) => {
    const roomId = singleValue(req.params.roomId);
    const roomInfo = await getPersistentMeetingRoom(roomId, await getMeetingRoomParticipantCount(roomId));
    if (!roomInfo) {
      res.json({
        roomMissing: true,
        peers: [],
        signals: [],
        missing: true,
      });
      return;
    }

    const peerId = String(req.query.peerId || "");
    const state = await pollMeetingRoomSession({
      roomId,
      peerId,
    });

    res.json(state);
  }),
);

meetingRoomRouter.post(
  "/:roomId/signal",
  asyncHandler(async (req, res) => {
    const result = await sendMeetingSignal({
      roomId: singleValue(req.params.roomId),
      fromPeerId: String(req.body.fromPeerId || ""),
      toPeerId: String(req.body.toPeerId || ""),
      type: req.body.type,
      payload: req.body.payload,
    });

    res.json(result);
  }),
);

meetingRoomRouter.post(
  "/:roomId/heartbeat",
  asyncHandler(async (req, res) => {
    const result = await touchMeetingParticipant({
      roomId: singleValue(req.params.roomId),
      peerId: String(req.body.peerId || ""),
    });

    res.json(result);
  }),
);

meetingRoomRouter.post(
  "/:roomId/leave",
  asyncHandler(async (req, res) => {
    const result = await leaveMeetingRoom({
      roomId: singleValue(req.params.roomId),
      peerId: String(req.body.peerId || ""),
    });

    res.json(result);
  }),
);
