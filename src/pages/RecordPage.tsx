import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

const RecordPage = () => {
  const [selectedHistoryRoomId, setSelectedHistoryRoomId] = useState("");

  const { data: roomHistoryData } = useQuery({
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

  useEffect(() => {
    if (!meetingRooms.length) {
      setSelectedHistoryRoomId("");
      return;
    }

    setSelectedHistoryRoomId((current) =>
      current && meetingRooms.some((room) => room.roomId === current)
        ? current
        : meetingRooms[0].roomId
    );
  }, [meetingRooms]);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="glass-card-elevated rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Saved meetings
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              Meeting records
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse previous or active rooms by title and meeting date.
            </p>
          </div>

          <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {meetingRooms.length} rooms
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {meetingRooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-5 text-sm text-muted-foreground">
              No saved meeting rooms yet.
            </div>
          ) : (
            meetingRooms.map((room) => (
              <button
                key={room.roomId}
                type="button"
                onClick={() => setSelectedHistoryRoomId(room.roomId)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  selectedHistoryRoomId === room.roomId
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border/50 bg-background/70 hover:border-primary/25 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{room.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatMeetingDate(room.createdAt)} | Host:{" "}
                      {room.hostName}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {room.participantCount} attendees
                  </span>
                </div>

                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Room code {room.roomId}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="glass-card-elevated rounded-2xl p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Participants
          </p>

          <h2 className="mt-2 text-lg font-semibold text-foreground">
            {selectedAttendanceData?.room.title ?? "Meeting attendees"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {selectedAttendanceData?.room
              ? `Meeting date: ${formatMeetingDateTime(
                  selectedAttendanceData.room.createdAt
                )}`
              : "Select a meeting room to fetch all attendees."}
          </p>
        </div>

        <div className="mt-5">
          {isAttendanceLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border/50 bg-background/70 p-4"
                >
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-200/70" />
                  <div className="mt-3 h-3 w-56 animate-pulse rounded bg-slate-200/70" />
                </div>
              ))}
            </div>
          ) : !selectedAttendanceData ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-5 text-sm text-muted-foreground">
              Select a room from the list to view its participants.
            </div>
          ) : selectedAttendanceData.attendees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-5 text-sm text-muted-foreground">
              No attendees have been recorded for this meeting yet.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedAttendanceData.attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="rounded-2xl border border-border/50 bg-background/80 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary">
                        <span className="text-xs font-bold text-primary-foreground">
                          {initials(attendee.name)}
                        </span>
                      </div>

                      <div>
                        <p className="font-medium text-foreground">
                          {attendee.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {attendee.email}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      Recorded
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      First joined{" "}
                      {formatMeetingDateTime(attendee.firstJoinedAt)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Last joined {formatMeetingDateTime(attendee.lastJoinedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordPage;