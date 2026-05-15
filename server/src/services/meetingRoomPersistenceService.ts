import {
  countMeetingRoomsByCode,
  createMeetingRoomRecord,
  deleteMeetingRoomRecordByCode,
  getMeetingRoomRecordByCode,
  listMeetingRoomRecords,
  type MeetingRoomRecord,
} from "../repositories/meetingRoomRepository.js";
import { AppError } from "../lib/appError.js";
import { countMeetingAttendanceByRoom, listMeetingAttendanceByRoom } from "../repositories/meetingAttendanceRepository.js";

function sanitizeRoomId(roomId: string) {
  return roomId.trim().toUpperCase();
}

function createRoomCodeCandidate() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function serializeRoom(record: MeetingRoomRecord, participantCount: number) {
  return {
    roomId: record.room_code,
    title: record.title,
    hostName: record.host_name,
    createdAt: new Date(record.created_at).getTime(),
    participantCount,
  };
}

function serializeAttendanceRecord(record: {
  id: number;
  user_email: string;
  name: string;
  first_joined_at: Date | string;
  last_joined_at: Date | string;
}) {
  return {
    id: record.id,
    email: record.user_email,
    name: record.name,
    firstJoinedAt: new Date(record.first_joined_at).getTime(),
    lastJoinedAt: new Date(record.last_joined_at).getTime(),
  };
}

export async function createPersistentMeetingRoom(input: { title: string; hostName: string }) {
  const title = input.title.trim() || "Untitled Meeting";
  const hostName = input.hostName.trim() || "Host";

  let roomCode = "";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = createRoomCodeCandidate();
    const existingCount = await countMeetingRoomsByCode(candidate);
    if (existingCount === 0) {
      roomCode = candidate;
      break;
    }
  }

  if (!roomCode) {
    throw new Error("Failed to generate a unique meeting room code.");
  }

  const record = await createMeetingRoomRecord({
    roomCode,
    title,
    hostName,
  });

  return serializeRoom(record, 0);
}

export async function getPersistentMeetingRoom(roomId: string, participantCount: number) {
  const record = await getMeetingRoomRecordByCode(sanitizeRoomId(roomId));
  if (!record || record.status !== "active") {
    return null;
  }

  return serializeRoom(record, participantCount);
}

export async function listPersistentMeetingRooms() {
  const records = await listMeetingRoomRecords();

  return Promise.all(
    records.map(async (record) => serializeRoom(record, await countMeetingAttendanceByRoom(record.room_code))),
  );
}

export async function getPersistentMeetingRoomAttendance(roomId: string) {
  const normalizedRoomId = sanitizeRoomId(roomId);
  const record = await getMeetingRoomRecordByCode(normalizedRoomId);
  if (!record || record.status !== "active") {
    return null;
  }

  const [participantCount, attendees] = await Promise.all([
    countMeetingAttendanceByRoom(normalizedRoomId),
    listMeetingAttendanceByRoom(normalizedRoomId),
  ]);

  return {
    room: serializeRoom(record, participantCount),
    attendees: attendees.map(serializeAttendanceRecord),
  };
}

export async function deletePersistentMeetingRoom(roomId: string) {
  const normalizedRoomId = sanitizeRoomId(roomId);
  const deleted = await deleteMeetingRoomRecordByCode(normalizedRoomId);
  if (!deleted) {
    throw new AppError("Meeting room not found.", 404);
  }

  return { ok: true as const };
}
