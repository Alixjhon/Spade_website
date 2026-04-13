export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  location: string;
  course: string;
  yearLevel: string;
  contactNumber: string;
  profilePictureUrl: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  change: string;
  icon: string;
}

export interface RecentActivityItem {
  id: string | number;
  user: string;
  action: string;
  type: string;
  time: string;
  profilePictureUrl: string;
}

export interface ClassroomActivityItem {
  id: number;
  title: string;
  description: string;
  deadline: string | null;
  points: number;
  classroomId: string;
  createdByEmail: string;
  createdAt?: string;
}

export interface Applicant {
  id: number;
  name: string;
  email: string;
  role: string;
  location: string;
  course: string;
  yearLevel: string;
  contactNumber: string;
  profilePictureUrl: string;
  projectTitle: string;
  projectDescription: string;
  projectAttachmentName: string;
  projectAttachmentUrl: string;
  status: "pending" | "approved" | "rejected";
  appliedDate: string;
}

export interface EventItem {
  id: number;
  title: string;
  date: string;
  time: string;
  description: string;
  organizer: string;
  attendees: number;
  category: string;
  location: string;
  imageUrl: string;
  socialCaption: string;
  createdByEmail: string;
}

export interface ProjectItem {
  id: number;
  title: string;
  description: string;
  role: string;
  type: string;
  date: string;
  activityId: number | null;
  linkedActivityTitle?: string;
  fileName: string;
  fileUrl: string;
  submittedByEmail: string;
}

export interface MeetingParticipant {
  name: string;
  isSpeaking: boolean;
}

export interface Meeting {
  id: number;
  title: string;
  status: string;
  participants: MeetingParticipant[];
  scheduledAt: string;
}

export interface MeetingRoomPeer {
  peerId: string;
  name: string;
  joinedAt: number;
}

export interface MeetingRoomInfo {
  roomId: string;
  title: string;
  hostName: string;
  createdAt: number;
  participantCount: number;
}

export interface MeetingRoomSignal {
  id: string;
  type: "offer" | "answer" | "ice-candidate";
  fromPeerId: string;
  toPeerId: string;
  payload: unknown;
  createdAt: number;
}

export interface Election {
  id: number;
  year: number;
  filingStart: string;
  filingEnd: string;
  votingStart: string;
  votingEnd: string;
  status: "upcoming" | "filing" | "voting" | "completed";
  resultsVisible: boolean;
}

export interface Candidate {
  id: number;
  electionId: number;
  position: string;
  name: string;
  email: string;
  manifesto: string;
  votes: number;
}
