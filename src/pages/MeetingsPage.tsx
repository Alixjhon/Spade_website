import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, MicOff, Monitor, MessageSquare, PhoneOff, Plus, Users, Video, VideoOff } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { MeetingRoomInfo, MeetingRoomPeer, MeetingRoomSignal } from "@/lib/types";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

type RemotePeerState = {
  peerId: string;
  name: string;
  joinedAt: number;
  stream: MediaStream | null;
  connectionState: string;
};

type PeerConnectionEntry = {
  peerId: string;
  connection: RTCPeerConnection;
  remoteStream: MediaStream;
  hasSentOffer: boolean;
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
}: {
  label: string;
  stream: MediaStream | null;
  muted?: boolean;
  highlighted?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-xl border bg-foreground/5 ${
        highlighted ? "border-primary/30 ring-2 ring-primary" : "border-border/50"
      }`}
    >
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover bg-black" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
            <span className="text-lg font-bold text-primary-foreground">{initials(label)}</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">{label}</div>
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
      const stream = await navigator.mediaDevices.getUserMedia(attempt.constraints);
      return {
        stream,
        warning: attempt.label === "camera and microphone" ? null : `Joined with ${attempt.label}.`,
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

  const [meetingTitleInput, setMeetingTitleInput] = useState("SPADE Team Meeting");
  const [joinCodeInput, setJoinCodeInput] = useState(roomCodeFromUrl);
  const [roomInfo, setRoomInfo] = useState<MeetingRoomInfo | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState(roomCodeFromUrl);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeerState[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [callState, setCallState] = useState<"idle" | "connecting" | "live" | "ended">("idle");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  const { data } = useQuery({
    queryKey: ["meeting"],
    queryFn: api.getMeeting,
  });

  const fallbackTitle = data?.meeting?.title ?? "SPADE Team Meeting";
  const peersRef = useRef(new Map<string, PeerConnectionEntry>());
  const peerIdRef = useRef("");
  const joinedAtRef = useRef(0);
  const localStreamRef = useRef<MediaStream | null>(null);
  const activeRoomRef = useRef("");

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

  function syncRoomToUrl(roomId: string) {
    const next = new URLSearchParams(searchParams);
    if (roomId) {
      next.set("room", roomId);
    } else {
      next.delete("room");
    }
    setSearchParams(next, { replace: true });
  }

  function updateRemotePeer(peerId: string, next: Partial<RemotePeerState> & Pick<RemotePeerState, "peerId">) {
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
    setRemotePeers((current) => current.filter((peer) => peer.peerId !== peerId));
  }

  async function sendSignal(toPeerId: string, type: MeetingRoomSignal["type"], payload: unknown) {
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

  async function ensurePeerConnection(peer: MeetingRoomPeer, shouldInitiate: boolean) {
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

    connection.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      updateRemotePeer(peer.peerId, {
        peerId: peer.peerId,
        name: peer.name,
        joinedAt: peer.joinedAt,
        stream: remoteStream,
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
        connectionState: connection.connectionState,
      });

      if (["failed", "closed", "disconnected"].includes(connection.connectionState)) {
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
      hasSentOffer: false,
    };

    peersRef.current.set(peer.peerId, entry);
    updateRemotePeer(peer.peerId, {
      peerId: peer.peerId,
      name: peer.name,
      joinedAt: peer.joinedAt,
      stream: remoteStream,
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

  async function handleSignal(signal: MeetingRoomSignal) {
    const existingPeer = remotePeers.find((peer) => peer.peerId === signal.fromPeerId);
    const entry = await ensurePeerConnection(
      {
        peerId: signal.fromPeerId,
        name: existingPeer?.name ?? "Guest",
        joinedAt: existingPeer?.joinedAt ?? Date.now(),
      },
      false,
    );

    if (signal.type === "offer") {
      await entry.connection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
      const answer = await entry.connection.createAnswer();
      await entry.connection.setLocalDescription(answer);
      await sendSignal(signal.fromPeerId, "answer", answer);
      return;
    }

    if (signal.type === "answer") {
      await entry.connection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
      return;
    }

    if (signal.type === "ice-candidate" && signal.payload) {
      try {
        await entry.connection.addIceCandidate(signal.payload as RTCIceCandidateInit);
      } catch {
        // Ignore candidates that arrive after a connection is gone.
      }
    }
  }

  async function leaveCurrentCall(clearSelectedRoom = false) {
    const currentRoomId = activeRoomRef.current;
    const currentPeerId = peerIdRef.current;

    peersRef.current.forEach((entry) => {
      entry.connection.close();
    });
    peersRef.current.clear();
    setRemotePeers([]);
    setCallState("ended");

    if (currentRoomId && currentPeerId) {
      await api.leaveMeetingRoom(currentRoomId, currentPeerId).catch(() => undefined);
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
    if (!user) {
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
      setRoomError(error instanceof Error ? error.message : "Failed to create meeting.");
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
      setRoomError(error instanceof Error ? error.message : "Meeting room not found.");
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
        setMediaError("This browser does not support camera and microphone access.");
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
        const message = error instanceof Error ? error.message : "Unable to access camera or microphone. You can still create or join a room.";
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
    if (!user || !selectedRoomId || activeRoomRef.current || (!localStream && !mediaError)) {
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
        const roomState = await api.pollMeetingRoom(activeRoomRef.current, peerIdRef.current);
        if (roomState.roomMissing) {
          setRoomError("This meeting was closed.");
          await leaveCurrentCall(true);
          return;
        }
        if (roomState.missing) {
          return;
        }

        const activePeerIds = new Set(roomState.peers.map((peer) => peer.peerId));

        roomState.peers.forEach((peer) => {
          void ensurePeerConnection(peer, joinedAtRef.current > peer.joinedAt);
        });

        roomState.signals.forEach((signal) => {
          activePeerIds.add(signal.fromPeerId);
          void handleSignal(signal);
        });

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
        const room = await api.joinMeetingRoom(selectedRoomId, {
          peerId: selfPeerId,
          name: user.name,
        });

        if (stopped) {
          await api.leaveMeetingRoom(room.room.roomId, selfPeerId).catch(() => undefined);
          return;
        }

        setRoomInfo(room.room);
        joinedAtRef.current = room.self.joinedAt;

        room.peers.forEach((peer) => {
          void ensurePeerConnection(peer, room.self.joinedAt > peer.joinedAt);
        });

        void pollRoom();

        pollTimer = window.setInterval(() => {
          void pollRoom();
        }, 1500);

        heartbeatTimer = window.setInterval(() => {
          if (activeRoomRef.current && peerIdRef.current) {
            void api.heartbeatMeetingRoom(activeRoomRef.current, peerIdRef.current);
          }
        }, 10000);
      } catch (error) {
        setRoomError(error instanceof Error ? error.message : "Failed to join meeting.");
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
          <p className="mt-1 text-muted-foreground">Create a meeting room or join one with a code.</p>
          {mediaError ? <p className="mt-2 text-sm text-destructive">{mediaError}</p> : null}
          {roomError ? <p className="mt-2 text-sm text-destructive">{roomError}</p> : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card-elevated rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Create Meeting</h2>
              <p className="mt-1 text-sm text-muted-foreground">Start a new room and share the code with other users.</p>
            </div>
            <Input
              value={meetingTitleInput}
              onChange={(event) => setMeetingTitleInput(event.target.value)}
              placeholder={fallbackTitle}
            />
            <Button onClick={() => void createRoom()} disabled={isCreatingRoom || !user} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {isCreatingRoom ? "Creating..." : "Create Meeting"}
            </Button>
          </div>

          <div className="glass-card-elevated rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Join Meeting</h2>
              <p className="mt-1 text-sm text-muted-foreground">Enter the meeting code shared by the host.</p>
            </div>
            <Input
              value={joinCodeInput}
              onChange={(event) => setJoinCodeInput(event.target.value.toUpperCase())}
              placeholder="Enter room code"
            />
            <Button onClick={() => void joinRoomByCode()} disabled={isJoiningRoom || !user} className="w-full">
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
          <p className="mt-1 text-muted-foreground">{roomInfo?.title ?? fallbackTitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Code: <span className="font-medium text-foreground">{selectedRoomId}</span> | Host: {roomInfo?.hostName ?? user?.name ?? "Unknown"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Status: {callState === "live" ? "connected" : callState === "connecting" ? "connecting" : "ended"}
          </p>
          {mediaError ? <p className="mt-2 text-sm text-destructive">{mediaError}</p> : null}
          {roomError ? <p className="mt-2 text-sm text-destructive">{roomError}</p> : null}
        </div>
        <div className="flex gap-2">
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

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <div className="glass-card-elevated rounded-2xl p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <VideoTile label={`${user?.name ?? "You"} (You)`} stream={localStream} muted highlighted={micOn} />
              {remotePeers.map((peer) => (
                <VideoTile
                  key={peer.peerId}
                  label={peer.name}
                  stream={peer.stream}
                  highlighted={peer.connectionState === "connected"}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 rounded-full ${!micOn ? "border-destructive bg-destructive/10 text-destructive" : ""}`}
              onClick={() => setMicOn((value) => !value)}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 rounded-full ${!videoOn ? "border-destructive bg-destructive/10 text-destructive" : ""}`}
              onClick={() => setVideoOn((value) => !value)}
            >
              {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full">
              <Monitor className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setShowParticipants((value) => !value)}
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void leaveCurrentCall(true);
              }}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {showParticipants && (
          <div className="glass-card w-full animate-scale-in p-4 lg:w-72">
            <h3 className="mb-3 font-semibold text-foreground">Participants ({participants.length})</h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.peerId} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary">
                    <span className="text-xs font-bold text-primary-foreground">{initials(participant.name)}</span>
                  </div>
                  <span className="flex-1 text-sm text-foreground">{participant.name}</span>
                  {participant.isSpeaking ? <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsPage;
