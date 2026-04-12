import {
  countMeetingRoomsByCode,
  createMeetingRoomRecord,
  getMeetingRoomRecordByCode,
  type MeetingRoomRecord,
} from "../repositories/meetingRoomRepository.js";

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
