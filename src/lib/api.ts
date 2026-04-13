import type {
  Applicant,
  Candidate,
  ClassroomActivityItem,
  DashboardStat,
  Election,
  EventItem,
  Meeting,
  MeetingRoomInfo,
  MeetingRoomPeer,
  MeetingRoomSignal,
  ProjectItem,
  RecentActivityItem,
  User,
} from "@/lib/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const AUTH_TOKEN_KEY = "spade.authToken";

export function getAuthToken() {
  return typeof window === "undefined" ? "" : window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let message = "Request failed.";

    if (raw) {
      try {
        const data = JSON.parse(raw) as { message?: string };
        message = data.message || message;
      } catch {
        message = raw.trim() || message;
      }
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (payload: { email: string; password: string }) =>
    request<{ user: User; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProfile: (payload: {
    email: string;
    name: string;
    location: string;
    course: string;
    yearLevel: string;
    contactNumber: string;
    profilePictureUrl: string;
  }) =>
    request<{ user: User }>("/api/auth/profile", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload: {
    email: string;
    password: string;
    role: string;
    name: string;
    location: string;
    course: string;
    yearLevel: string;
    contactNumber: string;
    profilePictureUrl: string;
    projectTitle: string;
    projectDescription: string;
    projectAttachmentName: string;
    projectAttachmentUrl: string;
  }) =>
    request<{ applicant: Applicant }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getDashboard: (email: string) =>
    request<{ user: User; stats: DashboardStat[]; activities: RecentActivityItem[] }>(
      `/api/dashboard?email=${encodeURIComponent(email)}`,
    ),

  getApplicants: () =>
    request<{ applicants: Applicant[] }>("/api/applicants"),

  updateApplicantStatus: (id: number, status: "approved" | "rejected") =>
    request<{ applicant: Applicant }>(`/api/applicants/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getEvents: () =>
    request<{ events: EventItem[] }>("/api/events"),

  createEvent: (payload: {
    title: string;
    date: string;
    time: string;
    description: string;
    organizer: string;
    category: string;
    location: string;
    imageUrl: string;
    socialCaption: string;
    createdByEmail: string;
  }) =>
    request<{ event: EventItem }>("/api/events", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProjects: () =>
    request<{ projects: ProjectItem[] }>("/api/projects"),

  getActivities: () =>
    request<{ activities: ClassroomActivityItem[] }>("/api/activities"),

  createActivity: (payload: {
    title: string;
    description: string;
    deadline: string | null;
    points: number;
    classroomId: string;
  }) =>
    request<{ activity: ClassroomActivityItem }>("/api/activities", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateActivity: (
    id: number,
    payload: {
      title: string;
      description: string;
      deadline: string | null;
      points: number;
    },
  ) =>
    request<{ activity: ClassroomActivityItem }>(`/api/activities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  submitProject: (payload: {
    activityId: number;
    title: string;
    description: string;
    fileUrl: string;
    fileName: string;
    submittedByEmail: string;
  }) =>
    request<{ project: ProjectItem }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProject: (
    id: number,
    payload: {
      title: string;
      description: string;
      fileUrl: string;
      fileName: string;
    },
  ) =>
    request<{ project: ProjectItem }>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getMeeting: () =>
    request<{ meeting: Meeting | null }>("/api/meetings"),

  createMeetingRoom: (payload: { title: string; hostName: string }) =>
    request<{ room: MeetingRoomInfo }>("/api/meeting-rooms/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMeetingRoom: (roomId: string) =>
    request<{ room: MeetingRoomInfo }>(`/api/meeting-rooms/${encodeURIComponent(roomId)}`),

  joinMeetingRoom: (roomId: string, payload: { peerId: string; name: string }) =>
    request<{ room: MeetingRoomInfo; self: MeetingRoomPeer; peers: MeetingRoomPeer[] }>(
      `/api/meeting-rooms/${encodeURIComponent(roomId)}/join`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  pollMeetingRoom: (roomId: string, peerId: string) =>
    request<{ peers: MeetingRoomPeer[]; signals: MeetingRoomSignal[]; missing: boolean; roomMissing: boolean }>(
      `/api/meeting-rooms/${encodeURIComponent(roomId)}/poll?peerId=${encodeURIComponent(peerId)}`,
    ),

  sendMeetingSignal: (
    roomId: string,
    payload: {
      fromPeerId: string;
      toPeerId: string;
      type: MeetingRoomSignal["type"];
      payload: unknown;
    },
  ) =>
    request<{ delivered: boolean }>(`/api/meeting-rooms/${encodeURIComponent(roomId)}/signal`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  heartbeatMeetingRoom: (roomId: string, peerId: string) =>
    request<{ ok: boolean }>(`/api/meeting-rooms/${encodeURIComponent(roomId)}/heartbeat`, {
      method: "POST",
      body: JSON.stringify({ peerId }),
    }),

  leaveMeetingRoom: (roomId: string, peerId: string) =>
    request<{ ok: boolean }>(`/api/meeting-rooms/${encodeURIComponent(roomId)}/leave`, {
      method: "POST",
      body: JSON.stringify({ peerId }),
    }),

  getElection: (email?: string) =>
    request<{
      election: Election | null;
      candidates: Candidate[];
      votedPositions: string[];
      votedCandidateIds: number[];
    }>(`/api/election${email ? `?email=${encodeURIComponent(email)}` : ""}`),

  fileCandidacy: (payload: { email: string; position: string; manifesto: string }) =>
    request<{ candidate: Candidate }>("/api/election/candidates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  vote: (payload: { email: string; candidateId: number }) =>
    request<{ ok: true }>("/api/election/vote", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateElectionSettings: (payload: {
    email: string;
    filingStart: string;
    filingEnd: string;
    votingStart: string;
    votingEnd: string;
  }) =>
    request<{ election: Election }>("/api/election/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
