export const APPLICANT_ROLES = [
  { id: "gamedev", label: "Game Developer", icon: "Gamepad2" },
  { id: "webdev", label: "Web Developer", icon: "Globe" },
  { id: "softwaredev", label: "Software Developer", icon: "Code" },
  { id: "media", label: "Media Team", icon: "Camera" },
] as const;

export const OFFICER_POSITIONS = [
  { id: "president", label: "President", icon: "Crown" },
  { id: "vice-president", label: "Vice President", icon: "Shield" },
  { id: "secretary", label: "Secretary", icon: "FileText" },
  { id: "asst-secretary", label: "Assistant Secretary", icon: "FilePen" },
  { id: "treasurer", label: "Treasurer", icon: "Wallet" },
  { id: "pio", label: "PIO", icon: "Megaphone" },
] as const;

export const ROLES = [
  ...OFFICER_POSITIONS,
  ...APPLICANT_ROLES,
] as const;

export type RoleId = (typeof ROLES)[number]["id"];
export type OfficerRoleId = (typeof OFFICER_POSITIONS)[number]["id"];
export type ApplicantRoleId = (typeof APPLICANT_ROLES)[number]["id"];

export const OFFICER_ROLE_IDS: RoleId[] = OFFICER_POSITIONS.map(r => r.id);

export const isOfficer = (role: RoleId) => OFFICER_ROLE_IDS.includes(role);
