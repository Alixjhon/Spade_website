import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock3,
  Loader2,
  Mail,
  Trash2,
  UserRound,
  Users2,
  Video,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
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
      enabled: Boolean(selectedHistoryRoomId && isAttendanceModalOpen),
    });

  const meetingRooms = roomHistoryData?.rooms ?? [];
  const selectedRoom =
    meetingRooms.find((room) => room.roomId === selectedHistoryRoomId) ?? null;
  const totalAttendeeRecords = meetingRooms.reduce(
    (total, room) => total + room.participantCount,
    0,
  );
  const selectedAttendeeCount =
    selectedAttendanceData?.attendees.length ?? selectedRoom?.participantCount ?? 0;
  const hasRooms = meetingRooms.length > 0;

  const deleteRoomMutation = useMutation({
    mutationFn: api.deleteMeetingRoom,
    onSuccess: (_data, deletedRoomId) => {
      queryClient.invalidateQueries({ queryKey: ["meeting-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["meeting-room-attendance"] });
      setSelectedHistoryRoomId((current) =>
        current === deletedRoomId ? "" : current,
      );
      if (selectedHistoryRoomId === deletedRoomId) {
        setIsAttendanceModalOpen(false);
      }
      toast.success("Meeting room deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!meetingRooms.length) {
      setSelectedHistoryRoomId("");
      setIsAttendanceModalOpen(false);
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
              Select a saved room to open its attendance list. Officers can
              also delete a room and its saved attendance data from here.
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
                Selected room
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
                {totalAttendeeRecords}
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

      <div className="grid gap-5">
        <section className="glass-card-elevated rounded-[2rem] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Meetings
              </p>
              <h2 className="text-lg font-semibold text-foreground">
                Saved meeting rooms
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Click a meeting to fetch its attendees in a modal.
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
                      onClick={() => {
                        setSelectedHistoryRoomId(room.roomId);
                        setIsAttendanceModalOpen(true);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {room.title}
                        </p>
                        {selectedHistoryRoomId === room.roomId && isAttendanceModalOpen && (
                          <span className="rounded-full bg-sky-600 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
                            Open
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
                        aria-label={`Delete ${room.title}`}
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
      </div>

      <Dialog
        open={isAttendanceModalOpen}
        onOpenChange={(open) => setIsAttendanceModalOpen(open)}
      >
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <div className="bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(255,255,255,0.96),rgba(16,185,129,0.10))] px-5 py-5 sm:px-7">
            <DialogHeader className="pr-8 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm ring-1 ring-sky-100">
                <Users2 className="h-5 w-5" />
              </div>
              <DialogTitle className="mt-3 text-xl leading-tight sm:text-2xl">
                {selectedAttendanceData?.room.title ??
                  selectedRoom?.title ??
                  "Meeting attendees"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {selectedAttendanceData?.room
                  ? `Meeting time: ${formatMeetingDateTime(
                      selectedAttendanceData.room.createdAt,
                    )}`
                  : selectedRoom
                    ? `Meeting time: ${formatMeetingDateTime(selectedRoom.createdAt)}`
                    : "Fetching meeting attendance."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Video className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Room
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {selectedRoom ? formatRoomCode(selectedRoom.roomId) : "None"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Users2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Attendees
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedAttendeeCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur sm:col-span-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Host
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {selectedRoom?.hostName ?? "Host"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[58vh] overflow-y-auto bg-slate-50/60 px-5 py-5 sm:px-7">
            {isAttendanceLoading ? (
              <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center shadow-sm">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-600" />
                <p className="mt-4 font-medium text-foreground">
                  Loading attendees
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fetching the saved attendance records for this meeting.
                </p>
              </div>
            ) : !selectedAttendanceData ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-white p-8 text-center shadow-sm">
                <Users2 className="mx-auto h-9 w-9 text-sky-500" />
                <p className="mt-4 font-medium text-foreground">
                  Attendance is almost ready
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                {hasRooms
                  ? "Fetching attendees for this meeting."
                  : "No saved rooms yet."}
                </p>
              </div>
            ) : selectedAttendanceData.attendees.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
                <Users2 className="mx-auto h-9 w-9 text-muted-foreground" />
                <p className="mt-4 font-medium text-foreground">
                  No attendees yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No attendees have been recorded for this meeting.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedAttendanceData.attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="rounded-2xl border border-border/50 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-primary shadow-sm">
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

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                              <Clock3 className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                First joined
                              </p>
                              <p className="truncate text-sm text-foreground">
                                {formatMeetingDateTime(attendee.firstJoinedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                              <Clock3 className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                Last joined
                              </p>
                              <p className="truncate text-sm text-foreground">
                                {formatMeetingDateTime(attendee.lastJoinedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordPage;
