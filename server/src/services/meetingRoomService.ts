import {
  countMeetingParticipants,
  deleteMeetingParticipant,
  deleteMeetingSignalsForPeer,
  enqueueMeetingSignal,
  getMeetingParticipant,
  listMeetingParticipants,
  pruneStaleMeetingParticipants,
  takeMeetingSignals,
  upsertMeetingParticipant,
} from "../repositories/meetingSessionRepository.js";

type SignalType = "offer" | "answer" | "ice-candidate";

const STALE_PARTICIPANT_MS = 60_000;

function sanitizeRoomId(roomId: string) {
  return roomId.trim().toUpperCase();
}

function serializePeer(peer: {
  peer_id: string;
  name: string;
  joined_at: Date | string;
}) {
  return {
    peerId: peer.peer_id,
    name: peer.name,
    joinedAt: new Date(peer.joined_at).getTime(),
  };
}

function serializeSignal(signal: {
  id: number;
  type: SignalType;
  from_peer_id: string;
  to_peer_id: string;
  payload: unknown;
  created_at: Date | string;
}) {
  return {
    id: String(signal.id),
    type: signal.type,
    fromPeerId: signal.from_peer_id,
    toPeerId: signal.to_peer_id,
    payload: signal.payload,
    createdAt: new Date(signal.created_at).getTime(),
  };
}

async function pruneStaleParticipants() {
  await pruneStaleMeetingParticipants(new Date(Date.now() - STALE_PARTICIPANT_MS));
}

export async function getMeetingRoomParticipantCount(roomId: string) {
  const normalizedRoomId = sanitizeRoomId(roomId);
  await pruneStaleParticipants();
  return countMeetingParticipants(normalizedRoomId);
}

export async function joinMeetingRoomSession(input: { roomId: string; peerId: string; name: string }) {
  const roomCode = sanitizeRoomId(input.roomId);
  const peerId = input.peerId.trim();
  const name = input.name.trim() || "Guest";

  await pruneStaleParticipants();

  const now = new Date();
  const existing = await getMeetingParticipant({ roomCode, peerId });
  const participant = await upsertMeetingParticipant({
    roomCode,
    peerId,
    name,
    joinedAt: existing ? new Date(existing.joined_at) : now,
    lastSeenAt: now,
  });

  const peers = (await listMeetingParticipants(roomCode))
    .filter((peer) => peer.peer_id !== peerId)
    .map(serializePeer);

  return {
    self: serializePeer(participant),
    peers,
  };
}

export async function pollMeetingRoomSession(input: { roomId: string; peerId: string }) {
  const roomCode = sanitizeRoomId(input.roomId);
  const peerId = input.peerId.trim();

  await pruneStaleParticipants();

  const participant = await getMeetingParticipant({ roomCode, peerId });
  if (!participant) {
    return {
      roomMissing: false,
      peers: [],
      signals: [],
      missing: true,
    };
  }

  await upsertMeetingParticipant({
    roomCode,
    peerId,
    name: participant.name,
    joinedAt: new Date(participant.joined_at),
    lastSeenAt: new Date(),
  });

  const peers = (await listMeetingParticipants(roomCode))
    .filter((peer) => peer.peer_id !== peerId)
    .map(serializePeer);
  const signals = (await takeMeetingSignals(roomCode, peerId)).map(serializeSignal);

  return {
    roomMissing: false,
    peers,
    signals,
    missing: false,
  };
}

export async function sendMeetingSignal(input: {
  roomId: string;
  fromPeerId: string;
  toPeerId: string;
  type: SignalType;
  payload: unknown;
}) {
  const roomCode = sanitizeRoomId(input.roomId);
  const fromPeerId = input.fromPeerId.trim();
  const toPeerId = input.toPeerId.trim();

  await pruneStaleParticipants();

  const [sender, receiver] = await Promise.all([
    getMeetingParticipant({ roomCode, peerId: fromPeerId }),
    getMeetingParticipant({ roomCode, peerId: toPeerId }),
  ]);

  if (!sender || !receiver) {
    return { delivered: false };
  }

  const now = new Date();
  await Promise.all([
    upsertMeetingParticipant({
      roomCode,
      peerId: fromPeerId,
      name: sender.name,
      joinedAt: new Date(sender.joined_at),
      lastSeenAt: now,
    }),
    upsertMeetingParticipant({
      roomCode,
      peerId: toPeerId,
      name: receiver.name,
      joinedAt: new Date(receiver.joined_at),
      lastSeenAt: now,
    }),
  ]);

  await enqueueMeetingSignal({
    roomCode,
    fromPeerId,
    toPeerId,
    type: input.type,
    payload: input.payload,
  });

  return { delivered: true };
}

export async function touchMeetingParticipant(input: { roomId: string; peerId: string }) {
  const roomCode = sanitizeRoomId(input.roomId);
  const peerId = input.peerId.trim();

  await pruneStaleParticipants();

  const participant = await getMeetingParticipant({ roomCode, peerId });
  if (!participant) {
    return { ok: false };
  }

  await upsertMeetingParticipant({
    roomCode,
    peerId,
    name: participant.name,
    joinedAt: new Date(participant.joined_at),
    lastSeenAt: new Date(),
  });

  return { ok: true };
}

export async function leaveMeetingRoom(input: { roomId: string; peerId: string }) {
  const roomCode = sanitizeRoomId(input.roomId);
  const peerId = input.peerId.trim();

  await deleteMeetingSignalsForPeer({ roomCode, peerId });
  await deleteMeetingParticipant({ roomCode, peerId });

  return { ok: true };
}
