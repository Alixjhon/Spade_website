export interface AuthenticatedUser {
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

export interface ApplicantRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  location: string;
  course: string;
  year_level: string;
  contact_number: string;
  profile_picture_url: string;
  project_title: string;
  project_description: string;
  project_attachment_name: string;
  project_attachment_url: string;
  status: "pending" | "rejected" | "active" | "approved";
  applied_at: string | Date;
}

export interface RegisterApplicantInput {
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
}

export interface UpdateProfileInput {
  email: string;
  name: string;
  location: string;
  course: string;
  yearLevel: string;
  contactNumber: string;
  profilePictureUrl: string;
}

export interface EventRecord {
  id: number;
  title: string;
  event_date: string | Date;
  event_time: string;
  description: string;
  organizer: string;
  attendees: number;
  category: string;
  location: string;
  image_url: string;
  social_caption: string;
  created_by_email: string;
}

export interface CreateEventInput {
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
}
