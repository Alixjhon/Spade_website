import { pool } from "../db/pool.js";

export type MeetingAttendanceRecord = {
  id: number;
  room_code: string;
  user_email: string;
  name: string;
  first_joined_at: Date | string;
  last_joined_at: Date | string;
  created_at: Date | string;
};

function isMissingTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42P01"
  );
}

export async function upsertMeetingAttendance(input: {
  roomCode: string;
  userEmail: string;
  name: string;
  joinedAt: Date;
}) {
  try {
    const result = await pool.query<MeetingAttendanceRecord>(
      `
      INSERT INTO meeting_room_attendance (
        room_code,
        user_email,
        name,
        first_joined_at,
        last_joined_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (room_code, user_email)
      DO UPDATE SET
        name = EXCLUDED.name,
        last_joined_at = NOW()
      RETURNING
        id,
        room_code,
        user_email,
        name,
        first_joined_at,
        last_joined_at,
        created_at
      `,
      [input.roomCode, input.userEmail, input.name, input.joinedAt],
    );

    return result.rows[0];
  } catch (error) {
    console.error("Failed to upsert meeting attendance:", error);
    throw error;
  }
}

export async function countMeetingAttendanceByRoom(roomCode: string) {
  try {
    const result = await pool.query<{ count: number }>(
      `
      SELECT COUNT(*)::int AS count
      FROM meeting_room_attendance
      WHERE room_code = $1
      `,
      [roomCode],
    );

    return result.rows[0]?.count ?? 0;
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }

    const fallbackResult = await pool.query<{ count: number }>(
      `
      SELECT COUNT(*)::int AS count
      FROM meeting_room_attendance
      WHERE room_code = $1
      `,
      [roomCode],
    );

    return fallbackResult.rows[0]?.count ?? 0;
  }
}

export async function listMeetingAttendanceByRoom(roomCode: string) {
  try {
    const result = await pool.query<MeetingAttendanceRecord>(
      `
      SELECT
        id,
        room_code,
        user_email,
        name,
        first_joined_at,
        last_joined_at,
        created_at
      FROM meeting_room_attendance
      WHERE room_code = $1
      ORDER BY first_joined_at ASC, id ASC
      `,
      [roomCode],
    );

    return result.rows;
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }

    throw error;
  }
}
