type SignalMessage = {
  id: string;
  type: "offer" | "answer" | "ice-candidate";
  fromPeerId: string;
  toPeerId: string;
  payload: unknown;
  createdAt: number;
};

type RoomParticipant = {
  peerId: string;
  name: string;
  joinedAt: number;
  lastSeenAt: number;
  queue: SignalMessage[];
};

type MeetingRoom = {
  roomId: string;
  participants: Map<string, RoomParticipant>;
};

const rooms = new Map<string, MeetingRoom>();
const STALE_PARTICIPANT_MS = 60_000;

function sanitizeRoomId(roomId: string) {
  return roomId.trim().toUpperCase();
}

function getRoom(roomId: string) {
  return rooms.get(sanitizeRoomId(roomId));
}

function pruneRoom(room: MeetingRoom) {
  const now = Date.now();

  for (const [peerId, participant] of room.participants.entries()) {
    if (now - participant.lastSeenAt > STALE_PARTICIPANT_MS) {
      room.participants.delete(peerId);
    }
  }
}

function serializePeer(peer: RoomParticipant) {
  return {
    peerId: peer.peerId,
    name: peer.name,
    joinedAt: peer.joinedAt,
  };
}

export function getMeetingRoomParticipantCount(roomId: string) {
  const room = getRoom(roomId);
  if (!room) {
    return 0;
  }

  pruneRoom(room);
  return room.participants.size;
}

export function ensureMeetingRoomSession(roomId: string) {
  const normalizedRoomId = sanitizeRoomId(roomId);
  const existing = rooms.get(normalizedRoomId);
  if (existing) {
    return existing;
  }

  const room: MeetingRoom = {
    roomId: normalizedRoomId,
    participants: new Map(),
  };
  rooms.set(normalizedRoomId, room);
  return room;
}

export function joinMeetingRoomSession(input: { roomId: string; peerId: string; name: string }) {
  const room = ensureMeetingRoomSession(input.roomId);

  pruneRoom(room);

  const now = Date.now();
  const existingParticipant = room.participants.get(input.peerId);
  const participant: RoomParticipant = existingParticipant ?? {
    peerId: input.peerId,
    name: input.name.trim() || "Guest",
    joinedAt: now,
    lastSeenAt: now,
    queue: [],
  };

  participant.name = input.name.trim() || participant.name || "Guest";
  participant.lastSeenAt = now;
  room.participants.set(input.peerId, participant);

  const peers = Array.from(room.participants.values())
    .filter((peer) => peer.peerId !== input.peerId)
    .map(serializePeer);

  return {
    self: serializePeer(participant),
    peers,
  };
}

export function pollMeetingRoomSession(input: { roomId: string; peerId: string }) {
  const room = getRoom(input.roomId);
  if (!room) {
    return {
      roomMissing: true,
      peers: [],
      signals: [],
      missing: true,
    };
  }

  pruneRoom(room);

  const participant = room.participants.get(input.peerId);
  if (!participant) {
    return {
      roomMissing: false,
      peers: [],
      signals: [],
      missing: true,
    };
  }

  participant.lastSeenAt = Date.now();

  const peers = Array.from(room.participants.values())
    .filter((peer) => peer.peerId !== input.peerId)
    .map(serializePeer);

  const signals = participant.queue.splice(0, participant.queue.length);

  return {
    roomMissing: false,
    peers,
    signals,
    missing: false,
  };
}

export function sendMeetingSignal(input: {
  roomId: string;
  fromPeerId: string;
  toPeerId: string;
  type: SignalMessage["type"];
  payload: unknown;
}) {
  const room = getRoom(input.roomId);
  if (!room) {
    return { delivered: false };
  }

  pruneRoom(room);

  const sender = room.participants.get(input.fromPeerId);
  const receiver = room.participants.get(input.toPeerId);
  if (!sender || !receiver) {
    return { delivered: false };
  }

  sender.lastSeenAt = Date.now();
  receiver.queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type: input.type,
    fromPeerId: input.fromPeerId,
    toPeerId: input.toPeerId,
    payload: input.payload,
    createdAt: Date.now(),
  });

  return { delivered: true };
}

export function touchMeetingParticipant(input: { roomId: string; peerId: string }) {
  const room = getRoom(input.roomId);
  if (!room) {
    return { ok: false };
  }

  pruneRoom(room);

  const participant = room.participants.get(input.peerId);
  if (!participant) {
    return { ok: false };
  }

  participant.lastSeenAt = Date.now();
  return { ok: true };
}

export function leaveMeetingRoom(input: { roomId: string; peerId: string }) {
  const room = getRoom(input.roomId);
  if (!room) {
    return { ok: true };
  }

  room.participants.delete(input.peerId);

  if (room.participants.size === 0) {
    rooms.delete(room.roomId);
  }

  return { ok: true };
}
