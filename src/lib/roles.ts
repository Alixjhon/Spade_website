export const ROLES = [
  { id: "president", label: "President", icon: "Crown" },
  { id: "vice-president", label: "Vice President", icon: "Shield" },
  { id: "secretary", label: "Secretary", icon: "FileText" },
  { id: "asst-secretary", label: "Assistant Secretary", icon: "FilePen" },
  { id: "treasurer", label: "Treasurer", icon: "Wallet" },
  { id: "pio", label: "PIO", icon: "Megaphone" },
  { id: "gamedev", label: "Game Developer", icon: "Gamepad2" },
  { id: "webdev", label: "Web Developer", icon: "Globe" },
  { id: "softwaredev", label: "Software Developer", icon: "Code" },
  { id: "media", label: "Media Team", icon: "Camera" },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];

export const OFFICER_ROLES: RoleId[] = [
  "president", "vice-president", "secretary", "asst-secretary", "treasurer", "pio",
];

export const isOfficer = (role: RoleId) => OFFICER_ROLES.includes(role);
