import { pool } from "../db/pool.js";

export type MeetingRoomRecord = {
  id: number;
  room_code: string;
  title: string;
  host_name: string;
  status: string;
  created_at: string | Date;
};

export async function getMeetingRoomRecordByCode(roomCode: string) {
  const result = await pool.query<MeetingRoomRecord>(
    `SELECT id, room_code, title, host_name, status, created_at
     FROM meeting_rooms
     WHERE room_code = $1
     LIMIT 1`,
    [roomCode],
  );

  return result.rows[0] ?? null;
}

export async function countMeetingRoomsByCode(roomCode: string) {
  const result = await pool.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM meeting_rooms WHERE room_code = $1",
    [roomCode],
  );

  return result.rows[0].count;
}

export async function createMeetingRoomRecord(input: {
  roomCode: string;
  title: string;
  hostName: string;
}) {
  const result = await pool.query<MeetingRoomRecord>(
    `INSERT INTO meeting_rooms (room_code, title, host_name)
     VALUES ($1, $2, $3)
     RETURNING id, room_code, title, host_name, status, created_at`,
    [input.roomCode, input.title, input.hostName],
  );

  return result.rows[0];
}

export async function listMeetingRoomRecords() {
  const result = await pool.query<MeetingRoomRecord>(
    `SELECT id, room_code, title, host_name, status, created_at
     FROM meeting_rooms
     WHERE status = 'active'
     ORDER BY created_at DESC, id DESC`,
  );
  return result.rows;
}
