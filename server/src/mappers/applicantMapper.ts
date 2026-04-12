import { toDateOnly } from "../lib/date.js";
import type { ApplicantRecord } from "../types/domain.js";

export function mapApplicant(record: ApplicantRecord) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    location: record.location,
    course: record.course,
    yearLevel: record.year_level,
    contactNumber: record.contact_number,
    profilePictureUrl: record.profile_picture_url,
    projectTitle: record.project_title,
    projectDescription: record.project_description,
    projectAttachmentName: record.project_attachment_name,
    projectAttachmentUrl: record.project_attachment_url,
    status: record.status,
    appliedDate: toDateOnly(record.applied_at),
  };
}
