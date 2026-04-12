import { toDateOnly } from "../lib/date.js";
import { AppError } from "../lib/appError.js";
import { createActivity as logActivity, listActivities, createClassroomActivity } from "../repositories/activityRepository.js";
import { createEvent, getLatestMeeting, listEvents, listProjects } from "../repositories/contentRepository.js";
import type { CreateEventInput, EventRecord } from "../types/domain.js";

function mapEvent(row: EventRecord) {
  return {
    id: row.id,
    title: row.title,
    date: toDateOnly(row.event_date),
    time: row.event_time,
    description: row.description,
    organizer: row.organizer,
    attendees: row.attendees,
    category: row.category,
    location: row.location,
    imageUrl: row.image_url,
    socialCaption: row.social_caption,
    createdByEmail: row.created_by_email,
  };
}

export async function getEvents() {
  const events = await listEvents();
  return events.map(mapEvent);
}

export async function createEventEntry(input: CreateEventInput, creatorEmail: string) {
  if (!input.title.trim()) {
    throw new AppError("Event title is required.", 400);
  }

  if (!input.date.trim()) {
    throw new AppError("Event date is required.", 400);
  }

  if (!input.time.trim()) {
    throw new AppError("Event time is required.", 400);
  }

  if (!input.description.trim()) {
    throw new AppError("Event description is required.", 400);
  }

  if (!input.organizer.trim()) {
    throw new AppError("Organizer is required.", 400);
  }

  if (!input.category.trim()) {
    throw new AppError("Category is required.", 400);
  }

  const event = await createEvent({
    ...input,
    title: input.title.trim(),
    date: input.date.trim(),
    time: input.time.trim(),
    description: input.description.trim(),
    organizer: input.organizer.trim(),
    category: input.category.trim(),
    location: input.location.trim(),
    imageUrl: input.imageUrl.trim(),
    socialCaption: input.socialCaption.trim(),
    createdByEmail: creatorEmail.trim(),
  });

  await createActivity(event.organizer, `created event: ${event.title}`, "event");

  return mapEvent(event);
}

export async function getProjects() {
  const projects = await listProjects();
  return projects.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    role: row.role,
    type: row.type,
    date: toDateOnly(row.submitted_at),
  }));
}

export async function getMeeting() {
  const meeting = await getLatestMeeting();
  if (!meeting) {
    return null;
  }

  return {
    id: meeting.id,
    title: meeting.title,
    status: meeting.status,
    participants: meeting.participants,
    scheduledAt: meeting.scheduled_at,
  };
}

export async function getActivities() {
  const activities = await listActivities();
  return activities.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    deadline: row.deadline ? toDateOnly(row.deadline) : null,
    points: row.points,
    classroomId: row.classroom_id,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
  }));
}

export async function createActivity(input: any, creatorEmail: string) {
  if (!input.title.trim()) {
    throw new AppError("Activity title is required.", 400);
  }

  if (!input.classroomId.trim()) {
    throw new AppError("Classroom is required.", 400);
  }

  const activity = await createClassroomActivity({
    title: input.title.trim(),
    description: input.description?.trim() || "",
    deadline: input.deadline,
    points: input.points || 100,
    classroomId: input.classroomId.trim(),
    createdByEmail: creatorEmail.trim(),
  });

  await logActivity(creatorEmail, `assigned activity: ${activity.title}`, "activity");

  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    deadline: activity.deadline ? toDateOnly(activity.deadline) : null,
    points: activity.points,
    classroomId: activity.classroom_id,
  };
}
