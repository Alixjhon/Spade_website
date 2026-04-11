export const mockUser = {
  name: "Alex Rivera",
  email: "alex@aclcbukidnon.com",
  role: "president" as const,
  avatar: "",
};

export const mockStats = [
  { label: "Total Members", value: "128", change: "+12%", icon: "Users" },
  { label: "Active Projects", value: "24", change: "+3", icon: "FolderOpen" },
  { label: "Upcoming Events", value: "7", change: "This month", icon: "Calendar" },
  { label: "Pending Approvals", value: "5", change: "Action needed", icon: "ClipboardCheck" },
];

export const mockActivities = [
  { id: 1, user: "Maria Santos", action: "uploaded a new project", time: "2 min ago", type: "project" },
  { id: 2, user: "John Doe", action: "submitted membership application", time: "15 min ago", type: "applicant" },
  { id: 3, user: "Sarah Lee", action: "created event: Tech Workshop", time: "1 hr ago", type: "event" },
  { id: 4, user: "Mike Chen", action: "voted in Officer Election", time: "2 hrs ago", type: "vote" },
  { id: 5, user: "Ana Cruz", action: "joined the Media Team", time: "3 hrs ago", type: "member" },
];

export const mockCandidates = [
  { id: 1, name: "Maria Santos", position: "President", votes: 45, totalVotes: 128, avatar: "", manifesto: "Building a stronger community through innovation and collaboration." },
  { id: 2, name: "John Doe", position: "President", votes: 38, totalVotes: 128, avatar: "", manifesto: "Empowering every member to reach their full potential." },
  { id: 3, name: "Sarah Lee", position: "Vice President", votes: 62, totalVotes: 128, avatar: "", manifesto: "Bridging the gap between departments for unified growth." },
  { id: 4, name: "Mike Chen", position: "Vice President", votes: 30, totalVotes: 128, avatar: "", manifesto: "Fostering creativity and technical excellence." },
];

export const mockEvents = [
  { id: 1, title: "Tech Workshop: React Basics", date: "2026-04-15", time: "2:00 PM", description: "Learn the fundamentals of React.js with hands-on exercises.", organizer: "Web Developer Team", attendees: 42, category: "Workshop" },
  { id: 2, title: "Game Jam 2026", date: "2026-04-20", time: "9:00 AM", description: "48-hour game development challenge. Build, create, and compete!", organizer: "Game Developer Team", attendees: 28, category: "Competition" },
  { id: 3, title: "General Assembly", date: "2026-04-25", time: "3:00 PM", description: "Quarterly general assembly meeting for all SPADE members.", organizer: "Executive Board", attendees: 98, category: "Meeting" },
  { id: 4, title: "UI/UX Design Sprint", date: "2026-05-02", time: "10:00 AM", description: "Collaborative design sprint focusing on mobile-first approaches.", organizer: "Media Team", attendees: 35, category: "Workshop" },
];

export const mockApplicants = [
  { id: 1, name: "Emma Wilson", email: "emma@aclcbukidnon.com", role: "webdev", status: "pending" as const, appliedDate: "2026-04-08" },
  { id: 2, name: "James Brown", email: "james@aclcbukidnon.com", role: "gamedev", status: "pending" as const, appliedDate: "2026-04-09" },
  { id: 3, name: "Lisa Park", email: "lisa@aclcbukidnon.com", role: "media", status: "approved" as const, appliedDate: "2026-04-05" },
  { id: 4, name: "Tom Garcia", email: "tom@aclcbukidnon.com", role: "softwaredev", status: "rejected" as const, appliedDate: "2026-04-03" },
];
