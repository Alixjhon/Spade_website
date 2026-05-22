import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Maximize2,
  Mic,
  MicOff,
  Monitor,
  MessageSquare,
  PhoneOff,
  Plus,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { isOfficer } from "@/lib/roles";
import type {
  MeetingRoomInfo,
  MeetingRoomPeer,
  MeetingRoomSignal,
} from "@/lib/types";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

type RemotePeerState = {
  peerId: string;
  name: string;
  joinedAt: number;
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  connectionState: string;
};

type PeerConnectionEntry = {
  peerId: string;
  connection: RTCPeerConnection;
  remoteStream: MediaStream;
  remoteScreenStream: MediaStream;
  remoteTrackStreamIds: Map<string, string>;
  screenSenders: RTCRtpSender[];
  hasSentOffer: boolean;
  pendingIceCandidates: RTCIceCandidateInit[];
};

type ScreenShareRequest = {
  peerId: string;
  name: string;
};

type ScreenShareResponsePayload = {
  allowed?: boolean;
};

type ScreenShareStartedPayload = {
  streamId?: string;
  presenterName?: string;
};

function buildPeerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `peer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function VideoTile({
  label,
  stream,
  muted = false,
  highlighted = false,
  presentation = false,
  allowFullscreen = false,
}: {
  label: string;
  stream: MediaStream | null;
  muted?: boolean;
  highlighted?: boolean;
  presentation?: boolean;
  allowFullscreen?: boolean;
}) {
  const tileRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  async function openFullscreen() {
    const tile = tileRef.current;
    if (!tile) {
      return;
    }

    if (tile.requestFullscreen) {
      await tile.requestFullscreen().catch(() => undefined);
      return;
    }

    const video = videoRef.current as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    video?.webkitEnterFullscreen?.();
  }

  return (
    <div
      ref={tileRef}
      className={`relative overflow-hidden rounded-xl border bg-foreground/5 ${
        presentation
          ? "aspect-video min-h-[180px] max-h-[calc(100svh-12rem)] sm:min-h-[280px] lg:min-h-[360px]"
          : "aspect-video"
      } ${highlighted ? "border-primary/30 ring-2 ring-primary" : "border-border/50"}`}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`h-full w-full bg-black ${presentation ? "object-contain" : "object-cover"}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
            <span className="text-lg font-bold text-primary-foreground">
              {initials(label)}
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {label}
      </div>

      {allowFullscreen && stream ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Fullscreen shared screen"
          title="Fullscreen shared screen"
          className="absolute right-2 top-2 h-9 w-9 bg-black/60 text-white hover:bg-black/75 hover:text-white"
          onClick={() => void openFullscreen()}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

async function getMediaStreamWithFallback() {
  const attempts: Array<{
    label: string;
    constraints: MediaStreamConstraints;
  }> = [
    {
      label: "camera and microphone",
      constraints: {
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
    },
    {
      label: "microphone only",
      constraints: {
        audio: true,
        video: false,
      },
    },
    {
      label: "camera only",
      constraints: {
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
    },
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        attempt.constraints,
      );
      return {
        stream,
        warning:
          attempt.label === "camera and microphone"
            ? null
            : `Joined with ${attempt.label}.`,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

const MeetingsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const roomCodeFromUrl = (searchParams.get("room") || "").trim().toUpperCase();

  const [meetingTitleInput, setMeetingTitleInput] =
    useState("SPADE Team Meeting");
  const [joinCodeInput, setJoinCodeInput] = useState(roomCodeFromUrl);
  const [roomInfo, setRoomInfo] = useState<MeetingRoomInfo | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState(roomCodeFromUrl);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenSharePermission, setScreenSharePermission] = useState(false);
  const [screenShareRequestStatus, setScreenShareRequestStatus] = useState<
    "idle" | "pending" | "approved" | "rejected"
  >("idle");
  const [pendingScreenShareRequest, setPendingScreenShareRequest] =
    useState<ScreenShareRequest | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeerState[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [callState, setCallState] = useState<
    "idle" | "connecting" | "live" | "ended"
  >("idle");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [selfJoinedAt, setSelfJoinedAt] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ["meeting"],
    queryFn: api.getMeeting,
  });

  const fallbackTitle = data?.meeting?.title ?? "SPADE Team Meeting";
  const canCreateMeeting = user ? isOfficer(user.role as Parameters<typeof isOfficer>[0]) : false;
  const peersRef = useRef(new Map<string, PeerConnectionEntry>());
  const peerIdRef = useRef("");
  const joinedAtRef = useRef(0);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const activeRoomRef = useRef("");
  const isRoomHostRef = useRef(false);
  const userNameRef = useRef("Presenter");
  const remotePeerMetaRef = useRef(new Map<string, { name: string; joinedAt: number }>());
  const expectedScreenStreamIdsRef = useRef(new Map<string, Set<string>>());

  const isRoomHost = Boolean(
    roomInfo?.hostName &&
      user?.name &&
      roomInfo.hostName.trim().toLowerCase() === user.name.trim().toLowerCase(),
  );

  useEffect(() => {
    isRoomHostRef.current = isRoomHost;
    userNameRef.current = user?.name ?? "Presenter";
  }, [isRoomHost, user?.name]);

  const participants = useMemo(
    () => [
      {
        peerId: "self",
        name: user?.name ?? "You",
        isSpeaking: micOn,
      },
      ...remotePeers.map((peer) => ({
        peerId: peer.peerId,
        name: peer.name,
        isSpeaking: peer.connectionState === "connected",
      })),
    ],
    [micOn, remotePeers, user?.name],
  );

  const remotePresentation = useMemo(
    () => remotePeers.find((peer) => peer.screenStream),
    [remotePeers],
  );

  useEffect(() => {
    screenStreamRef.current = screenStream;
    return () => {
      screenStream?.getTracks().forEach((track) => track.stop());
    };
  }, [screenStream]);

  function syncRoomToUrl(roomId: string) {
    const next = new URLSearchParams(searchParams);
    if (roomId) {
      next.set("room", roomId);
    } else {
      next.delete("room");
    }
    setSearchParams(next, { replace: true });
  }

  async function sendSignal(
    toPeerId: string,
    type: MeetingRoomSignal["type"],
    payload: unknown,
  ) {
    if (!peerIdRef.current || !activeRoomRef.current) {
      return;
    }

    await api.sendMeetingSignal(activeRoomRef.current, {
      fromPeerId: peerIdRef.current,
      toPeerId,
      type,
      payload,
    });
  }

  async function broadcastSignal(
    type: MeetingRoomSignal["type"],
    payload: unknown,
  ) {
    await Promise.all(
      Array.from(peersRef.current.keys()).map((peerId) =>
        sendSignal(peerId, type, payload),
      ),
    );
  }

  async function renegotiatePeer(entry: PeerConnectionEntry) {
    if (entry.connection.signalingState === "closed") {
      return;
    }

    const offer = await entry.connection.createOffer();
    await entry.connection.setLocalDescription(offer);
    await sendSignal(entry.peerId, "offer", offer);
  }

  async function stopScreenShare(notifyPeers = true) {
    const currentScreenStream = screenStreamRef.current;

    peersRef.current.forEach((entry) => {
      entry.screenSenders.forEach((sender) => {
        if (entry.connection.signalingState !== "closed") {
          entry.connection.removeTrack(sender);
        }
      });
      entry.screenSenders = [];
      void renegotiatePeer(entry);
    });

    currentScreenStream?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsScreenSharing(false);

    if (notifyPeers) {
      await broadcastSignal("screen-share-stopped", {});
    }
  }

  async function startScreenShare() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMediaError("This browser does not support screen sharing.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        void stopScreenShare();
      });

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);
      setScreenShareRequestStatus("idle");

      const payload: ScreenShareStartedPayload = {
        streamId: stream.id,
        presenterName: userNameRef.current,
      };

      await broadcastSignal("screen-share-started", payload);

      peersRef.current.forEach((entry) => {
        entry.screenSenders.forEach((sender) => {
          if (entry.connection.signalingState !== "closed") {
            entry.connection.removeTrack(sender);
          }
        });
        entry.screenSenders = stream.getTracks().map((track) =>
          entry.connection.addTrack(track, stream),
        );
        void renegotiatePeer(entry);
      });
    } catch {
      setIsScreenSharing(false);
    }
  }

  async function requestScreenSharePermission() {
    const hostPeer = remotePeers.find(
      (peer) =>
        roomInfo?.hostName &&
        peer.name.trim().toLowerCase() === roomInfo.hostName.trim().toLowerCase(),
    );

    if (!hostPeer) {
      setMediaError("The host must be connected before you can request screen sharing.");
      return;
    }

    setScreenShareRequestStatus("pending");
    await sendSignal(hostPeer.peerId, "screen-share-request", {
      name: user?.name ?? "Guest",
    });
  }

  async function respondToScreenShareRequest(allowed: boolean) {
    if (!pendingScreenShareRequest) {
      return;
    }

    await sendSignal(pendingScreenShareRequest.peerId, "screen-share-response", {
      allowed,
    } satisfies ScreenShareResponsePayload);
    setPendingScreenShareRequest(null);
  }

  async function toggleScreenShare() {
    if (screenStreamRef.current) {
      await stopScreenShare();
      return;
    }

    if (isRoomHost || screenSharePermission) {
      await startScreenShare();
      return;
    }

    await requestScreenSharePermission();
  }

  function updateRemotePeer(
    peerId: string,
    next: Partial<RemotePeerState> & Pick<RemotePeerState, "peerId">,
  ) {
    if (next.name || next.joinedAt) {
      const current = remotePeerMetaRef.current.get(peerId);
      remotePeerMetaRef.current.set(peerId, {
        name: next.name ?? current?.name ?? "Guest",
        joinedAt: next.joinedAt ?? current?.joinedAt ?? Date.now(),
      });
    }

    setRemotePeers((current) => {
      const existing = current.find((peer) => peer.peerId === peerId);
      if (!existing) {
        return [
          ...current,
          {
            peerId,
            name: next.name ?? "Guest",
            joinedAt: next.joinedAt ?? Date.now(),
            stream: next.stream ?? null,
            screenStream: next.screenStream ?? null,
            connectionState: next.connectionState ?? "connecting",
          },
        ].sort((a, b) => a.joinedAt - b.joinedAt);
      }

      return current
        .map((peer) => (peer.peerId === peerId ? { ...peer, ...next } : peer))
        .sort((a, b) => a.joinedAt - b.joinedAt);
    });
  }

  function removeRemotePeer(peerId: string) {
    const entry = peersRef.current.get(peerId);
    if (entry) {
      entry.connection.close();
      peersRef.current.delete(peerId);
    }
    expectedScreenStreamIdsRef.current.delete(peerId);
    remotePeerMetaRef.current.delete(peerId);
    setPendingScreenShareRequest((current) =>
      current?.peerId === peerId ? null : current,
    );
    setRemotePeers((current) =>
      current.filter((peer) => peer.peerId !== peerId),
    );
  }

  function removeTrackFromStream(stream: MediaStream, trackId: string) {
    const track = stream.getTracks().find((candidate) => candidate.id === trackId);
    if (track) {
      stream.removeTrack(track);
    }
  }

  function moveExpectedScreenTracks(entry: PeerConnectionEntry, streamId: string) {
    entry.remoteStream.getTracks().forEach((track) => {
      if (entry.remoteTrackStreamIds.get(track.id) !== streamId) {
        return;
      }

      entry.remoteStream.removeTrack(track);
      if (!entry.remoteScreenStream.getTracks().some((existing) => existing.id === track.id)) {
        entry.remoteScreenStream.addTrack(track);
      }
    });

    updateRemotePeer(entry.peerId, {
      peerId: entry.peerId,
      name: remotePeerMetaRef.current.get(entry.peerId)?.name ?? "Guest",
      joinedAt: remotePeerMetaRef.current.get(entry.peerId)?.joinedAt ?? Date.now(),
      stream: entry.remoteStream,
      screenStream:
        entry.remoteScreenStream.getTracks().length > 0
          ? entry.remoteScreenStream
          : null,
      connectionState: entry.connection.connectionState,
    });
  }

  async function ensurePeerConnection(
    peer: MeetingRoomPeer,
    shouldInitiate: boolean,
  ) {
    const existing = peersRef.current.get(peer.peerId);
    if (existing) {
      updateRemotePeer(peer.peerId, {
        peerId: peer.peerId,
        name: peer.name,
        joinedAt: peer.joinedAt,
      });
      return existing;
    }

    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const remoteStream = new MediaStream();
    const remoteScreenStream = new MediaStream();
    const remoteTrackStreamIds = new Map<string, string>();

    connection.ontrack = (event) => {
      const incomingStream = event.streams[0];
      const expectedScreenIds = expectedScreenStreamIdsRef.current.get(peer.peerId);
      const isScreenTrack = Boolean(
        incomingStream?.id && expectedScreenIds?.has(incomingStream.id),
      );
      const targetStream = isScreenTrack ? remoteScreenStream : remoteStream;

      (incomingStream?.getTracks() ?? [event.track]).forEach((track) => {
        if (incomingStream?.id) {
          remoteTrackStreamIds.set(track.id, incomingStream.id);
        }
        removeTrackFromStream(isScreenTrack ? remoteStream : remoteScreenStream, track.id);
        if (!targetStream.getTracks().some((existing) => existing.id === track.id)) {
          targetStream.addTrack(track);
        }
        track.addEventListener("ended", () => {
          if (isScreenTrack) {
            updateRemotePeer(peer.peerId, {
              peerId: peer.peerId,
              name: peer.name,
              joinedAt: peer.joinedAt,
              screenStream: null,
              connectionState: connection.connectionState,
            });
          }
        });
      });
      updateRemotePeer(peer.peerId, {
        peerId: peer.peerId,
        name: peer.name,
        joinedAt: peer.joinedAt,
        stream: remoteStream,
        screenStream: remoteScreenStream.getTracks().length > 0 ? remoteScreenStream : null,
        connectionState: connection.connectionState,
      });
    };

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        void sendSignal(peer.peerId, "ice-candidate", event.candidate.toJSON());
      }
    };

    connection.onconnectionstatechange = () => {
      updateRemotePeer(peer.peerId, {
        peerId: peer.peerId,
        name: peer.name,
        joinedAt: peer.joinedAt,
        stream: remoteStream,
        screenStream: remoteScreenStream.getTracks().length > 0 ? remoteScreenStream : null,
        connectionState: connection.connectionState,
      });

      if (
        ["failed", "closed", "disconnected"].includes(
          connection.connectionState,
        )
      ) {
        removeRemotePeer(peer.peerId);
      }
    };

    const stream = localStreamRef.current;
    stream?.getTracks().forEach((track) => {
      connection.addTrack(track, stream);
    });

    const entry: PeerConnectionEntry = {
      peerId: peer.peerId,
      connection,
      remoteStream,
      remoteScreenStream,
      remoteTrackStreamIds,
      screenSenders: [],
      hasSentOffer: false,
      pendingIceCandidates: [],
    };

    peersRef.current.set(peer.peerId, entry);
    const currentScreenStream = screenStreamRef.current;
    if (currentScreenStream) {
      await sendSignal(peer.peerId, "screen-share-started", {
        streamId: currentScreenStream.id,
        presenterName: userNameRef.current,
      } satisfies ScreenShareStartedPayload);
      entry.screenSenders = currentScreenStream.getTracks().map((track) =>
        connection.addTrack(track, currentScreenStream),
      );
    }
    updateRemotePeer(peer.peerId, {
      peerId: peer.peerId,
      name: peer.name,
      joinedAt: peer.joinedAt,
      stream: remoteStream,
      screenStream: remoteScreenStream.getTracks().length > 0 ? remoteScreenStream : null,
      connectionState: connection.connectionState,
    });

    if (shouldInitiate && !entry.hasSentOffer) {
      entry.hasSentOffer = true;
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      await sendSignal(peer.peerId, "offer", offer);
    }

    return entry;
  }

  async function flushPendingIceCandidates(entry: PeerConnectionEntry) {
    if (!entry.connection.remoteDescription) {
      return;
    }

    while (entry.pendingIceCandidates.length > 0) {
      const candidate = entry.pendingIceCandidates.shift();
      if (!candidate) {
        continue;
      }

      try {
        await entry.connection.addIceCandidate(candidate);
      } catch {
        // Ignore stale candidates from a previous connection state.
      }
    }
  }

  async function handleSignal(signal: MeetingRoomSignal) {
    const knownPeer = remotePeerMetaRef.current.get(signal.fromPeerId);

    if (signal.type === "screen-share-request") {
      if (!isRoomHostRef.current) {
        return;
      }

      const payload = signal.payload as { name?: string };
      setPendingScreenShareRequest({
        peerId: signal.fromPeerId,
        name: payload.name ?? knownPeer?.name ?? "Guest",
      });
      return;
    }

    if (signal.type === "screen-share-response") {
      const payload = signal.payload as ScreenShareResponsePayload;
      if (payload.allowed) {
        setScreenSharePermission(true);
        setScreenShareRequestStatus("approved");
        await startScreenShare();
      } else {
        setScreenSharePermission(false);
        setScreenShareRequestStatus("rejected");
      }
      return;
    }

    if (signal.type === "screen-share-started") {
      const payload = signal.payload as ScreenShareStartedPayload;
      const entry = peersRef.current.get(signal.fromPeerId);
      entry?.remoteScreenStream.getTracks().forEach((track) => {
        entry.remoteScreenStream.removeTrack(track);
      });
      if (payload.streamId) {
        const ids =
          expectedScreenStreamIdsRef.current.get(signal.fromPeerId) ??
          new Set<string>();
        ids.add(payload.streamId);
        expectedScreenStreamIdsRef.current.set(signal.fromPeerId, ids);
        if (entry) {
          moveExpectedScreenTracks(entry, payload.streamId);
        }
      }
      updateRemotePeer(signal.fromPeerId, {
        peerId: signal.fromPeerId,
        name: payload.presenterName ?? knownPeer?.name ?? "Presenter",
        joinedAt: knownPeer?.joinedAt ?? Date.now(),
        ...(entry
          ? {
              stream: entry.remoteStream,
              screenStream:
                entry.remoteScreenStream.getTracks().length > 0
                  ? entry.remoteScreenStream
                  : null,
            }
          : {}),
      });
      return;
    }

    if (signal.type === "screen-share-stopped") {
      expectedScreenStreamIdsRef.current.delete(signal.fromPeerId);
      const entry = peersRef.current.get(signal.fromPeerId);
      entry?.remoteScreenStream.getTracks().forEach((track) => {
        entry.remoteScreenStream.removeTrack(track);
      });
      updateRemotePeer(signal.fromPeerId, {
        peerId: signal.fromPeerId,
        name: knownPeer?.name ?? "Guest",
        joinedAt: knownPeer?.joinedAt ?? Date.now(),
        screenStream: null,
      });
      return;
    }

    const entry = await ensurePeerConnection(
      {
        peerId: signal.fromPeerId,
        name: knownPeer?.name ?? "Guest",
        joinedAt: knownPeer?.joinedAt ?? Date.now(),
      },
      false,
    );

    if (signal.type === "offer") {
      await entry.connection.setRemoteDescription(
        signal.payload as RTCSessionDescriptionInit,
      );
      await flushPendingIceCandidates(entry);
      const answer = await entry.connection.createAnswer();
      await entry.connection.setLocalDescription(answer);
      await sendSignal(signal.fromPeerId, "answer", answer);
      return;
    }

    if (signal.type === "answer") {
      await entry.connection.setRemoteDescription(
        signal.payload as RTCSessionDescriptionInit,
      );
      await flushPendingIceCandidates(entry);
      return;
    }

    if (signal.type === "ice-candidate" && signal.payload) {
      const candidate = signal.payload as RTCIceCandidateInit;
      if (!entry.connection.remoteDescription) {
        entry.pendingIceCandidates.push(candidate);
        return;
      }

      try {
        await entry.connection.addIceCandidate(candidate);
      } catch {
        // Ignore candidates that arrive after a connection is gone.
      }
    }
  }

  async function leaveCurrentCall(clearSelectedRoom = false) {
    const currentRoomId = activeRoomRef.current;
    const currentPeerId = peerIdRef.current;

    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsScreenSharing(false);
    setScreenSharePermission(false);
    setScreenShareRequestStatus("idle");
    setPendingScreenShareRequest(null);

    peersRef.current.forEach((entry) => {
      entry.connection.close();
    });
    peersRef.current.clear();
    remotePeerMetaRef.current.clear();
    expectedScreenStreamIdsRef.current.clear();
    setRemotePeers([]);
    setCallState("ended");
    setSelfJoinedAt(null);

    if (currentRoomId && currentPeerId) {
      await api
        .leaveMeetingRoom(currentRoomId, currentPeerId)
        .catch(() => undefined);
    }

    activeRoomRef.current = "";
    peerIdRef.current = "";
    joinedAtRef.current = 0;

    if (clearSelectedRoom) {
      setSelectedRoomId("");
      setRoomInfo(null);
      syncRoomToUrl("");
    }
  }

  async function createRoom() {
    if (!user || !canCreateMeeting) {
      return;
    }

    setIsCreatingRoom(true);
    setRoomError(null);

    try {
      const title = meetingTitleInput.trim() || fallbackTitle;
      const response = await api.createMeetingRoom({
        title,
        hostName: user.name,
      });

      setMeetingTitleInput(response.room.title);
      setSelectedRoomId(response.room.roomId);
      setJoinCodeInput(response.room.roomId);
      setRoomInfo(response.room);
      setCallState("idle");
      syncRoomToUrl(response.room.roomId);
    } catch (error) {
      setRoomError(
        error instanceof Error ? error.message : "Failed to create meeting.",
      );
    } finally {
      setIsCreatingRoom(false);
    }
  }

  async function joinRoomByCode() {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setRoomError("Enter a meeting code first.");
      return;
    }

    setIsJoiningRoom(true);
    setRoomError(null);

    try {
      const response = await api.getMeetingRoom(code);
      setSelectedRoomId(response.room.roomId);
      setRoomInfo(response.room);
      syncRoomToUrl(response.room.roomId);
    } catch (error) {
      setRoomError(
        error instanceof Error ? error.message : "Meeting room not found.",
      );
    } finally {
      setIsJoiningRoom(false);
    }
  }

  async function copyInvite() {
    if (!roomInfo) {
      return;
    }

    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomInfo.roomId}`;
    await navigator.clipboard.writeText(inviteUrl).catch(() => undefined);
  }

  useEffect(() => {
    if (roomCodeFromUrl && roomCodeFromUrl !== selectedRoomId) {
      setJoinCodeInput(roomCodeFromUrl);
      setSelectedRoomId(roomCodeFromUrl);
      setRoomInfo(null);
    }
  }, [roomCodeFromUrl, selectedRoomId]);

  useEffect(() => {
    let cancelled = false;

    async function startLocalMedia() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError(
          "This browser does not support camera and microphone access.",
        );
        return;
      }

      try {
        const { stream, warning } = await getMediaStreamWithFallback();

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        stream.getAudioTracks().forEach((track) => {
          track.enabled = micOn;
        });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = videoOn;
        });

        localStreamRef.current = stream;
        setLocalStream(stream);
        setMicOn(stream.getAudioTracks().length > 0);
        setVideoOn(stream.getVideoTracks().length > 0);
        setMediaError(warning);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to access camera or microphone. You can still create or join a room.";
        setMicOn(false);
        setVideoOn(false);
        setMediaError(`${message} You can still create or join a room.`);
      }
    }

    void startLocalMedia();

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = micOn;
    });
  }, [localStream, micOn]);

  useEffect(() => {
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = videoOn;
    });
  }, [localStream, videoOn]);

  useEffect(() => {
    if (
      !user ||
      !selectedRoomId ||
      activeRoomRef.current ||
      (!localStream && !mediaError)
    ) {
      return;
    }

    let stopped = false;
    let pollTimer: number | undefined;
    let heartbeatTimer: number | undefined;
    const selfPeerId = buildPeerId();

    peerIdRef.current = selfPeerId;
    activeRoomRef.current = selectedRoomId;
    setCallState("connecting");
    setRoomError(null);

    async function pollRoom() {
      if (stopped || !activeRoomRef.current || !peerIdRef.current) {
        return;
      }

      try {
        const roomState = await api.pollMeetingRoom(
          activeRoomRef.current,
          peerIdRef.current,
        );
        if (roomState.roomMissing) {
          setRoomError("This meeting was closed.");
          await leaveCurrentCall(true);
          return;
        }
        if (roomState.missing) {
          return;
        }

        const activePeerIds = new Set(
          roomState.peers.map((peer) => peer.peerId),
        );

        for (const peer of roomState.peers) {
          await ensurePeerConnection(peer, joinedAtRef.current > peer.joinedAt);
        }

        for (const signal of roomState.signals) {
          activePeerIds.add(signal.fromPeerId);
          await handleSignal(signal);
        }

        Array.from(peersRef.current.keys()).forEach((peerId) => {
          if (!activePeerIds.has(peerId)) {
            removeRemotePeer(peerId);
          }
        });

        setCallState("live");
      } catch {
        setCallState("connecting");
      }
    }

    async function joinRoom() {
      try {
        if (!user) {
          return;
        }

        const room = await api.joinMeetingRoom(selectedRoomId, {
          peerId: selfPeerId,
          name: user.name,
          email: user.email,
        });

        if (stopped) {
          await api
            .leaveMeetingRoom(room.room.roomId, selfPeerId)
            .catch(() => undefined);
          return;
        }

        setRoomInfo(room.room);
        joinedAtRef.current = room.self.joinedAt;
        setSelfJoinedAt(room.self.joinedAt);

        for (const peer of room.peers) {
          await ensurePeerConnection(peer, room.self.joinedAt > peer.joinedAt);
        }

        void pollRoom();

        pollTimer = window.setInterval(() => {
          void pollRoom();
        }, 1500);

        heartbeatTimer = window.setInterval(() => {
          if (activeRoomRef.current && peerIdRef.current) {
            void api.heartbeatMeetingRoom(
              activeRoomRef.current,
              peerIdRef.current,
            );
          }
        }, 10000);
      } catch (error) {
        setRoomError(
          error instanceof Error ? error.message : "Failed to join meeting.",
        );
        setCallState("ended");
        activeRoomRef.current = "";
        peerIdRef.current = "";
      }
    }

    void joinRoom();

    return () => {
      stopped = true;
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
      if (heartbeatTimer) {
        window.clearInterval(heartbeatTimer);
      }
      void leaveCurrentCall();
    };
  }, [localStream, mediaError, selectedRoomId, user]);

  if (!selectedRoomId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          <p className="mt-1 text-muted-foreground">
            Create a meeting room or join one with a code.
          </p>
          {mediaError ? (
            <p className="mt-2 text-sm text-destructive">{mediaError}</p>
          ) : null}
          {roomError ? (
            <p className="mt-2 text-sm text-destructive">{roomError}</p>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {canCreateMeeting && (
            <div className="glass-card-elevated rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Create Meeting
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start a new room and share the code with other users.
                </p>
              </div>
              <Input
                value={meetingTitleInput}
                onChange={(event) => setMeetingTitleInput(event.target.value)}
                placeholder={fallbackTitle}
              />
              <Button
                onClick={() => void createRoom()}
                disabled={isCreatingRoom || !user}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isCreatingRoom ? "Creating..." : "Create Meeting"}
              </Button>
            </div>
          )}

          <div className="glass-card-elevated rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Join Meeting
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the meeting code shared by the host.
              </p>
            </div>
            <Input
              value={joinCodeInput}
              onChange={(event) =>
                setJoinCodeInput(event.target.value.toUpperCase())
              }
              placeholder="Enter room code"
            />
            <Button
              onClick={() => void joinRoomByCode()}
              disabled={isJoiningRoom || !user}
              className="w-full"
            >
              {isJoiningRoom ? "Joining..." : "Join Meeting"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          <p className="mt-1 text-muted-foreground">
            {roomInfo?.title ?? fallbackTitle}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Code:{" "}
            <span className="font-medium text-foreground">
              {selectedRoomId}
            </span>{" "}
            | Host: {roomInfo?.hostName ?? user?.name ?? "Unknown"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Status:{" "}
            {callState === "live"
              ? "connected"
              : callState === "connecting"
                ? "connecting"
                : "ended"}
          </p>
          {mediaError ? (
            <p className="mt-2 text-sm text-destructive">{mediaError}</p>
          ) : null}
          {roomError ? (
            <p className="mt-2 text-sm text-destructive">{roomError}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void copyInvite()}>
            Copy Invite Link
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void leaveCurrentCall(true);
            }}
          >
            Leave Room
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="glass-card-elevated rounded-xl p-2 sm:rounded-2xl sm:p-4">
            {screenStream ? (
              <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-1 sm:mb-4 sm:rounded-2xl sm:p-2">
                <VideoTile
                  label={`${user?.name ?? "You"} is presenting`}
                  stream={screenStream}
                  muted
                  highlighted
                  presentation
                  allowFullscreen
                />
              </div>
            ) : remotePresentation?.screenStream ? (
              <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-1 sm:mb-4 sm:rounded-2xl sm:p-2">
                <VideoTile
                  label={`${remotePresentation.name} is presenting`}
                  stream={remotePresentation.screenStream}
                  highlighted
                  presentation
                  allowFullscreen
                />
              </div>
            ) : null}

            <div
              className={
                screenStream || remotePresentation?.screenStream
                  ? "grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                  : "grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3"
              }
            >
              <VideoTile
                label={`${user?.name ?? "You"} (You)`}
                stream={localStream}
                muted
                highlighted={!screenStream && micOn}
              />

              {remotePeers.map((peer) => (
                <VideoTile
                  key={peer.peerId}
                  label={peer.name}
                  stream={peer.stream}
                  highlighted={
                    !screenStream && peer.connectionState === "connected"
                  }
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              className={`h-11 w-11 rounded-full sm:h-12 sm:w-12 ${!micOn ? "border-destructive bg-destructive/10 text-destructive" : ""}`}
              onClick={() => setMicOn((value) => !value)}
            >
              {micOn ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className={`h-11 w-11 rounded-full sm:h-12 sm:w-12 ${!videoOn ? "border-destructive bg-destructive/10 text-destructive" : ""}`}
              onClick={() => setVideoOn((value) => !value)}
            >
              {videoOn ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className={`h-11 w-11 rounded-full sm:h-12 sm:w-12 ${
                isScreenSharing
                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary"
                  : screenShareRequestStatus === "pending"
                    ? "border-primary/60 bg-primary/5 text-primary"
                  : ""
              }`}
              disabled={screenShareRequestStatus === "pending"}
              onClick={() => void toggleScreenShare()}
            >
              <Monitor className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full sm:h-12 sm:w-12"
              onClick={() => setShowParticipants((value) => !value)}
            >
              <Users className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full sm:h-12 sm:w-12"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              className="h-11 w-11 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:h-12 sm:w-12"
              onClick={() => {
                void leaveCurrentCall(true);
              }}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>

          {screenShareRequestStatus !== "idle" && !isScreenSharing ? (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {screenShareRequestStatus === "pending"
                ? "Waiting for the host to approve screen sharing."
                : screenShareRequestStatus === "approved"
                  ? "Screen sharing approved."
                  : "The host rejected your screen sharing request."}
            </p>
          ) : null}
        </div>

        {showParticipants && (
          <div className="glass-card w-full animate-scale-in p-4 xl:w-72">
            <h3 className="mb-3 font-semibold text-foreground">
              Participants ({participants.length})
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.peerId}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary">
                    <span className="text-xs font-bold text-primary-foreground">
                      {initials(participant.name)}
                    </span>
                  </div>
                  <span className="flex-1 text-sm text-foreground">
                    {participant.name}
                  </span>
                  {participant.isSpeaking ? (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isRoomHost && pendingScreenShareRequest ? (
        <div className="fixed bottom-6 right-6 z-50 w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-border bg-background p-4 shadow-xl">
          <p className="text-sm font-medium text-foreground">
            {pendingScreenShareRequest.name} wants to share their screen.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => void respondToScreenShareRequest(false)}
            >
              Reject
            </Button>
            <Button onClick={() => void respondToScreenShareRequest(true)}>
              Accept
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MeetingsPage;
