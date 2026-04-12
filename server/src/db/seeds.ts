export const seedUsers = [
  { name: "Alex Rivera", email: "alex@aclcbukidnon.com", role: "president" },
  { name: "Maria Santos", email: "maria@aclcbukidnon.com", role: "vice-president" },
];

export const seedApplicants = [
  {
    name: "Emma Wilson",
    email: "emma@aclcbukidnon.com",
    role: "webdev",
    status: "pending",
    location: "Malaybalay City",
    course: "BSIT",
    yearLevel: "2nd Year",
    contactNumber: "09171234567",
    profilePictureUrl: "",
    projectTitle: "Campus Event Microsite",
    projectDescription: "A responsive microsite for tracking events, RSVPs, and announcements.",
    projectAttachmentName: "campus-event-microsite.pdf",
    projectAttachmentUrl: "",
  },
  {
    name: "James Brown",
    email: "james@aclcbukidnon.com",
    role: "gamedev",
    status: "pending",
    location: "Valencia City",
    course: "BSCS",
    yearLevel: "3rd Year",
    contactNumber: "09179876543",
    profilePictureUrl: "",
    projectTitle: "Unity Puzzle Prototype",
    projectDescription: "A level-based prototype focused on logic puzzles and progression loops.",
    projectAttachmentName: "unity-puzzle-build.zip",
    projectAttachmentUrl: "",
  },
  {
    name: "Lisa Park",
    email: "lisa@aclcbukidnon.com",
    role: "media",
    status: "active",
    location: "Manolo Fortich",
    course: "BSIT",
    yearLevel: "4th Year",
    contactNumber: "09174561234",
    profilePictureUrl: "",
    projectTitle: "SPADE Branding Kit",
    projectDescription: "Posters, social cards, and content templates for organization campaigns.",
    projectAttachmentName: "branding-kit.zip",
    projectAttachmentUrl: "",
  },
  {
    name: "Tom Garcia",
    email: "tom@aclcbukidnon.com",
    role: "softwaredev",
    status: "rejected",
    location: "Quezon, Bukidnon",
    course: "BSIS",
    yearLevel: "1st Year",
    contactNumber: "09170001111",
    profilePictureUrl: "",
    projectTitle: "Inventory Console App",
    projectDescription: "A simple Java inventory tracker for small organizations.",
    projectAttachmentName: "inventory-console-app.zip",
    projectAttachmentUrl: "",
  },
];

export const seedActivities = [
  { user_name: "Maria Santos", action: "uploaded a new project", type: "project", created_at: "2026-04-11T08:58:00Z" },
  { user_name: "John Doe", action: "submitted membership application", type: "applicant", created_at: "2026-04-11T08:45:00Z" },
  { user_name: "Sarah Lee", action: "created event: Tech Workshop", type: "event", created_at: "2026-04-11T07:59:00Z" },
  { user_name: "Mike Chen", action: "voted in Officer Election", type: "vote", created_at: "2026-04-11T07:00:00Z" },
  { user_name: "Ana Cruz", action: "joined the Media Team", type: "member", created_at: "2026-04-11T06:00:00Z" },
];

export const seedEvents = [
  {
    title: "Tech Workshop: React Basics",
    event_date: "2026-04-15",
    event_time: "2:00 PM",
    description: "Learn the fundamentals of React.js with hands-on exercises.",
    organizer: "Web Developer Team",
    attendees: 42,
    category: "Workshop",
  },
  {
    title: "Game Jam 2026",
    event_date: "2026-04-20",
    event_time: "9:00 AM",
    description: "48-hour game development challenge. Build, create, and compete!",
    organizer: "Game Developer Team",
    attendees: 28,
    category: "Competition",
  },
  {
    title: "General Assembly",
    event_date: "2026-04-25",
    event_time: "3:00 PM",
    description: "Quarterly general assembly meeting for all SPADE members.",
    organizer: "Executive Board",
    attendees: 98,
    category: "Meeting",
  },
  {
    title: "UI/UX Design Sprint",
    event_date: "2026-05-02",
    event_time: "10:00 AM",
    description: "Collaborative design sprint focusing on mobile-first approaches.",
    organizer: "Media Team",
    attendees: 35,
    category: "Workshop",
  },
];

export const seedProjects = [
  { title: "SPADE Mobile App", description: "Cross-platform mobile application for SPADE members", role: "Software Developer", type: "code", submitted_at: "2026-04-10" },
  { title: "Event Poster - Game Jam", description: "Promotional poster for the upcoming Game Jam 2026", role: "Media Team", type: "image", submitted_at: "2026-04-08" },
  { title: "Portfolio Website", description: "Official SPADE portfolio website redesign", role: "Web Developer", type: "code", submitted_at: "2026-04-06" },
  { title: "2D Platformer Demo", description: "Game prototype built with Unity for showcasing", role: "Game Developer", type: "code", submitted_at: "2026-04-04" },
];

export const seedMeetings = [
  {
    title: "SPADE Team Meeting",
    status: "live",
    participants: JSON.stringify([
      { name: "Alex Rivera", isSpeaking: true },
      { name: "Maria Santos", isSpeaking: false },
      { name: "John Doe", isSpeaking: false },
      { name: "Sarah Lee", isSpeaking: true },
      { name: "Mike Chen", isSpeaking: false },
      { name: "Ana Cruz", isSpeaking: false },
    ]),
    scheduled_at: "2026-04-11T09:00:00Z",
  },
];

export const seedCandidates = [
  { position: "president", name: "Maria Santos", email: "maria@aclcbukidnon.com", manifesto: "Building a stronger community through innovation.", votes: 45 },
  { position: "president", name: "John Doe", email: "john@aclcbukidnon.com", manifesto: "Empowering every member to reach their potential.", votes: 38 },
  { position: "vice-president", name: "Sarah Lee", email: "sarah@aclcbukidnon.com", manifesto: "Bridging departments for unified growth.", votes: 62 },
];
