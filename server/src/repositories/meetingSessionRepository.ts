import { pool } from "../db/pool.js";

export type MeetingParticipantRecord = {
  room_code: string;
  peer_id: string;
  name: string;
  joined_at: Date | string;
  last_seen_at: Date | string;
};

export type MeetingSignalRecord = {
  id: number;
  room_code: string;
  from_peer_id: string;
  to_peer_id: string;
  type: "offer" | "answer" | "ice-candidate";
  payload: unknown;
  created_at: Date | string;
};

export async function pruneStaleMeetingParticipants(staleBefore: Date) {
  await pool.query("DELETE FROM meeting_room_participants WHERE last_seen_at < $1", [staleBefore]);
}

export async function upsertMeetingParticipant(input: {
  roomCode: string;
  peerId: string;
  name: string;
  joinedAt: Date;
  lastSeenAt: Date;
}) {
  const result = await pool.query<MeetingParticipantRecord>(
    `INSERT INTO meeting_room_participants (room_code, peer_id, name, joined_at, last_seen_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (room_code, peer_id)
     DO UPDATE SET
       name = EXCLUDED.name,
       last_seen_at = EXCLUDED.last_seen_at
     RETURNING room_code, peer_id, name, joined_at, last_seen_at`,
    [input.roomCode, input.peerId, input.name, input.joinedAt, input.lastSeenAt],
  );

  return result.rows[0];
}

export async function getMeetingParticipant(input: { roomCode: string; peerId: string }) {
  const result = await pool.query<MeetingParticipantRecord>(
    `SELECT room_code, peer_id, name, joined_at, last_seen_at
     FROM meeting_room_participants
     WHERE room_code = $1 AND peer_id = $2
     LIMIT 1`,
    [input.roomCode, input.peerId],
  );

  return result.rows[0] ?? null;
}

export async function listMeetingParticipants(roomCode: string) {
  const result = await pool.query<MeetingParticipantRecord>(
    `SELECT room_code, peer_id, name, joined_at, last_seen_at
     FROM meeting_room_participants
     WHERE room_code = $1
     ORDER BY joined_at ASC`,
    [roomCode],
  );

  return result.rows;
}

export async function countMeetingParticipants(roomCode: string) {
  const result = await pool.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM meeting_room_participants WHERE room_code = $1",
    [roomCode],
  );

  return result.rows[0]?.count ?? 0;
}

export async function enqueueMeetingSignal(input: {
  roomCode: string;
  fromPeerId: string;
  toPeerId: string;
  type: "offer" | "answer" | "ice-candidate";
  payload: unknown;
}) {
  const result = await pool.query<MeetingSignalRecord>(
    `INSERT INTO meeting_room_signals (room_code, from_peer_id, to_peer_id, type, payload)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, room_code, from_peer_id, to_peer_id, type, payload, created_at`,
    [input.roomCode, input.fromPeerId, input.toPeerId, input.type, input.payload],
  );

  return result.rows[0];
}

export async function takeMeetingSignals(roomCode: string, toPeerId: string) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query<MeetingSignalRecord>(
      `SELECT id, room_code, from_peer_id, to_peer_id, type, payload, created_at
       FROM meeting_room_signals
       WHERE room_code = $1 AND to_peer_id = $2
       ORDER BY created_at ASC, id ASC
       FOR UPDATE`,
      [roomCode, toPeerId],
    );

    if (result.rows.length > 0) {
      await client.query("DELETE FROM meeting_room_signals WHERE id = ANY($1::int[])", [result.rows.map((row) => row.id)]);
    }

    await client.query("COMMIT");
    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteMeetingParticipant(input: { roomCode: string; peerId: string }) {
  await pool.query("DELETE FROM meeting_room_participants WHERE room_code = $1 AND peer_id = $2", [
    input.roomCode,
    input.peerId,
  ]);
}

export async function deleteMeetingSignalsForPeer(input: { roomCode: string; peerId: string }) {
  await pool.query("DELETE FROM meeting_room_signals WHERE room_code = $1 AND (from_peer_id = $2 OR to_peer_id = $2)", [
    input.roomCode,
    input.peerId,
  ]);
}
