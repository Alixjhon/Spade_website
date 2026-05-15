import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock3,
  Mail,
  Trash2,
  UserRound,
  Users2,
  Video,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { isOfficer } from "@/lib/roles";
import { toast } from "sonner";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatMeetingDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
}

function formatMeetingDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function formatRoomCode(roomId: string) {
  return roomId.toUpperCase();
}

function formatRoomCreatedLabel(timestamp: number) {
  return `Created ${formatMeetingDateTime(timestamp)}`;
}

const RecordPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedHistoryRoomId, setSelectedHistoryRoomId] = useState("");
  const canDeleteMeetingRooms = user
    ? isOfficer(user.role as Parameters<typeof isOfficer>[0])
    : false;

  const { data: roomHistoryData, isLoading: isRoomsLoading } = useQuery({
    queryKey: ["meeting-rooms"],
    queryFn: api.listMeetingRooms,
  });

  const { data: selectedAttendanceData, isLoading: isAttendanceLoading } =
    useQuery({
      queryKey: ["meeting-room-attendance", selectedHistoryRoomId],
      queryFn: () => api.getMeetingRoomAttendance(selectedHistoryRoomId),
      enabled: Boolean(selectedHistoryRoomId),
    });

  const meetingRooms = roomHistoryData?.rooms ?? [];
  const selectedRoom =
    meetingRooms.find((room) => room.roomId === selectedHistoryRoomId) ?? null;
  const selectedAttendeeCount = selectedAttendanceData?.attendees.length ?? 0;
  const hasRooms = meetingRooms.length > 0;

  const deleteRoomMutation = useMutation({
    mutationFn: api.deleteMeetingRoom,
    onSuccess: (_data, deletedRoomId) => {
      queryClient.invalidateQueries({ queryKey: ["meeting-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["meeting-room-attendance"] });
      setSelectedHistoryRoomId((current) =>
        current === deletedRoomId ? "" : current,
      );
      toast.success("Meeting room deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!meetingRooms.length) {
      setSelectedHistoryRoomId("");
      return;
    }

    setSelectedHistoryRoomId((current) =>
      current && meetingRooms.some((room) => room.roomId === current) ? current : "",
    );
  }, [meetingRooms]);

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98),rgba(224,242,254,0.88))] p-6 shadow-sm">
        <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-100/60 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-700/80">
              Records
            </p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">
              Meeting room records
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Pick a saved room to view its attendees. Officers can also delete
              a room and its saved attendance data from here.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Rooms
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {meetingRooms.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Current room
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {selectedRoom ? formatRoomCode(selectedRoom.roomId) : "None"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Attendees
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {selectedAttendeeCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Actions
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {canDeleteMeetingRooms ? "Officer tools" : "View only"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass-card-elevated rounded-[2rem] p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Rooms
              </p>
              <h2 className="text-lg font-semibold text-foreground">
                Choose a room
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select any saved room to load its attendance list.
              </p>
            </div>

            <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {meetingRooms.length} rooms
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {isRoomsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[1.5rem] border border-border/50 bg-background/70 p-4"
                  >
                    <div className="h-4 w-36 animate-pulse rounded bg-slate-200/70" />
                    <div className="mt-3 h-3 w-48 animate-pulse rounded bg-slate-200/70" />
                    <div className="mt-4 h-8 w-24 animate-pulse rounded-full bg-slate-200/70" />
                  </div>
                ))}
              </div>
            ) : meetingRooms.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-border/60 bg-background/60 p-6 text-sm text-muted-foreground">
                No saved meeting rooms yet.
              </div>
            ) : (
              meetingRooms.map((room) => (
                <div
                  key={room.roomId}
                  className={`rounded-[1.75rem] border p-4 transition ${
                    selectedHistoryRoomId === room.roomId
                      ? "border-sky-300/70 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(224,242,254,0.9))] shadow-md ring-1 ring-sky-200/70"
                      : "border-border/50 bg-background/75 hover:border-sky-200 hover:bg-slate-50/90"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedHistoryRoomId(room.roomId)}
                      className="flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {room.title}
                        </p>
                        {selectedHistoryRoomId === room.roomId && (
                          <span className="rounded-full bg-sky-600 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
                            Selected
                          </span>
                        )}
                        <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
                          {formatRoomCode(room.roomId)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200/70">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatMeetingDate(room.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200/70">
                          <UserRound className="h-3.5 w-3.5" />
                          Host: {room.hostName}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200/70">
                          <Users2 className="h-3.5 w-3.5" />
                          {room.participantCount} attendees
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-muted-foreground">
                        {formatRoomCreatedLabel(room.createdAt)}
                      </p>
                    </button>

                    {canDeleteMeetingRooms && (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 shrink-0 rounded-full border-rose-200 bg-white/90 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        disabled={deleteRoomMutation.isPending}
                        onClick={() => {
                          const confirmed = window.confirm(
                            `Delete room ${room.title}? This will also delete all attendee records for this room.`,
                          );
                          if (!confirmed) return;
                          deleteRoomMutation.mutate(room.roomId);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="glass-card-elevated rounded-[2rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Attendees
              </p>
              <h2 className="text-lg font-semibold text-foreground">
                {selectedAttendanceData?.room.title ?? "View attendees"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedAttendanceData?.room
                  ? `Meeting time: ${formatMeetingDateTime(
                      selectedAttendanceData.room.createdAt,
                    )}`
                  : "The attendees container stays ready here. Click a room on the left to load its attendee list."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-[320px]">
              <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Selected room
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Video className="h-4 w-4 text-primary" />
                  {selectedRoom ? formatRoomCode(selectedRoom.roomId) : "None"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Attendees
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users2 className="h-4 w-4 text-primary" />
                  {selectedAttendeeCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            {isAttendanceLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[1.75rem] border border-border/50 bg-background/70 p-4"
                  >
                    <div className="h-4 w-40 animate-pulse rounded bg-slate-200/70" />
                    <div className="mt-3 h-3 w-56 animate-pulse rounded bg-slate-200/70" />
                    <div className="mt-4 h-8 w-28 animate-pulse rounded-full bg-slate-200/70" />
                  </div>
                ))}
              </div>
            ) : !selectedAttendanceData ? (
              <div className="rounded-[1.75rem] border border-dashed border-border/60 bg-background/60 p-6 text-sm text-muted-foreground">
                {hasRooms
                  ? "Room data has loaded. Click any room in the left container to fetch and show its attendees here."
                  : "No saved rooms yet."}
              </div>
            ) : selectedAttendanceData.attendees.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-border/60 bg-background/60 p-6 text-sm text-muted-foreground">
                No attendees have been recorded for this meeting yet.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedAttendanceData.attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="rounded-[1.75rem] border border-border/50 bg-background/75 p-4 transition hover:border-sky-200 hover:bg-slate-50/90"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary shadow-sm">
                        <span className="text-xs font-bold text-primary-foreground">
                          {initials(attendee.name)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {attendee.name}
                            </p>
                            <p className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{attendee.email}</span>
                            </p>
                          </div>

                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-700">
                            Saved
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                              First joined
                            </p>
                            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-foreground">
                              <Clock3 className="h-3.5 w-3.5 text-sky-600" />
                              {formatMeetingDateTime(attendee.firstJoinedAt)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                              Last joined
                            </p>
                            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-foreground">
                              <Clock3 className="h-3.5 w-3.5 text-sky-600" />
                              {formatMeetingDateTime(attendee.lastJoinedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RecordPage;
