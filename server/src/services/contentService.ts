import { toDateOnly } from "../lib/date.js";
import { AppError } from "../lib/appError.js";
import { createActivity as logActivity, createClassroomActivity, findActivityById, listActivities, updateClassroomActivity } from "../repositories/activityRepository.js";
import { createEvent, createProject, findProjectById, getLatestMeeting, listEvents, listProjects, updateProject } from "../repositories/contentRepository.js";
import type { CreateEventInput, CreateProjectInput, EventRecord, ProjectRecord, UpdateActivityInput, UpdateProjectInput } from "../types/domain.js";

interface CreateActivityInput {
  title: string;
  description?: string;
  deadline: string | null;
  points?: number;
  classroomId: string;
}

const classroomRoleMap: Record<string, string> = {
  gamedev: "Game Developer",
  webdev: "Web Developer",
  softwaredev: "Software Developer",
  media: "Media Team",
};

function getAccessibleClassroomIds(role: string) {
  if (role === "president") {
    return Object.keys(classroomRoleMap);
  }

  return role in classroomRoleMap ? [role] : [];
}

function getAccessibleProjectRoles(role: string) {
  return getAccessibleClassroomIds(role).map(
    (classroomId) => classroomRoleMap[classroomId],
  );
}

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

function mapProject(row: ProjectRecord) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    role: row.role,
    type: row.type,
    date: toDateOnly(row.submitted_at),
    activityId: row.activity_id ?? null,
    linkedActivityTitle: row.activity_title ?? "",
    fileName: row.file_name ?? "",
    fileUrl: row.file_url ?? "",
    submittedByEmail: row.submitted_by_email ?? "",
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

  await logActivity(event.organizer, `created event: ${event.title}`, "event");

  return mapEvent(event);
}

export async function getProjects(userRole: string) {
  const projects = await listProjects();
  const accessibleRoles = new Set(getAccessibleProjectRoles(userRole));

  return projects
    .filter((project) => accessibleRoles.has(project.role))
    .map(mapProject);
}

function inferProjectType(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) {
    return "image";
  }

  if (["pdf", "doc", "docx", "ppt", "pptx", "txt"].includes(extension)) {
    return "document";
  }

  return "code";
}

export async function submitProject(input: CreateProjectInput, userRole: string) {
  if (!Number.isInteger(input.activityId) || input.activityId <= 0) {
    throw new AppError("Activity is required.", 400);
  }

  if (!input.title?.trim()) {
    throw new AppError("Project title is required.", 400);
  }

  if (!input.description?.trim()) {
    throw new AppError("Project description is required.", 400);
  }

  if (!input.fileUrl?.trim() || !input.fileName?.trim()) {
    throw new AppError("Project file is required.", 400);
  }

  if (!input.submittedByEmail?.trim()) {
    throw new AppError("Submitting user is required.", 400);
  }

  const activity = await findActivityById(input.activityId);

  if (!activity) {
    throw new AppError("Selected activity was not found.", 404);
  }

  const accessibleClassroomIds = new Set(getAccessibleClassroomIds(userRole));
  if (!accessibleClassroomIds.has(activity.classroom_id)) {
    throw new AppError("You do not have access to submit to this classroom activity.", 403);
  }

  const today = new Date().toISOString().slice(0, 10);
  if (activity.deadline && activity.deadline < today) {
    throw new AppError("This activity is already closed. The deadline has passed.", 400);
  }

  const project = await createProject({
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    fileName: input.fileName.trim(),
    fileUrl: input.fileUrl.trim(),
    submittedByEmail: input.submittedByEmail.trim(),
    role: classroomRoleMap[activity.classroom_id] ?? activity.classroom_id,
    type: inferProjectType(input.fileName),
  });

  await logActivity(input.submittedByEmail.trim(), `submitted project: ${project.title}`, "project");

  return mapProject(project);
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

export async function getActivities(userRole: string) {
  const activities = await listActivities();
  const accessibleClassroomIds = new Set(getAccessibleClassroomIds(userRole));

  return activities
    .filter((row) => accessibleClassroomIds.has(row.classroom_id))
    .map((row) => ({
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

export async function createActivity(input: CreateActivityInput, creatorEmail: string) {
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
    createdByEmail: activity.created_by_email,
    createdAt: activity.created_at,
  };
}

export async function editActivity(
  activityId: number,
  input: UpdateActivityInput,
  creatorEmail: string,
  userRole: string,
) {
  if (userRole !== "president") {
    throw new AppError("Only the president can edit assigned activities.", 403);
  }

  const activity = await findActivityById(activityId);
  if (!activity) {
    throw new AppError("Activity not found.", 404);
  }

  if (activity.created_by_email !== creatorEmail) {
    throw new AppError("You can only edit activities that you assigned.", 403);
  }

  if (!input.title.trim()) {
    throw new AppError("Activity title is required.", 400);
  }

  const updated = await updateClassroomActivity({
    id: activityId,
    title: input.title.trim(),
    description: input.description?.trim() || "",
    deadline: input.deadline,
    points: input.points || activity.points,
  });

  if (!updated) {
    throw new AppError("Failed to update activity.", 500);
  }

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    deadline: updated.deadline ? toDateOnly(updated.deadline) : null,
    points: updated.points,
    classroomId: updated.classroom_id,
    createdByEmail: updated.created_by_email,
    createdAt: updated.created_at,
  };
}

export async function editProject(
  projectId: number,
  input: UpdateProjectInput,
  userEmail: string,
  userRole: string,
) {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  if (project.submitted_by_email !== userEmail) {
    throw new AppError("You can only edit your own submitted project.", 403);
  }

  const accessibleRoles = new Set(getAccessibleProjectRoles(userRole));
  if (!accessibleRoles.has(project.role)) {
    throw new AppError("You do not have access to edit this project.", 403);
  }

  if (!input.title.trim()) {
    throw new AppError("Project title is required.", 400);
  }

  if (!input.description.trim()) {
    throw new AppError("Project description is required.", 400);
  }

  if (!input.fileName.trim() || !input.fileUrl.trim()) {
    throw new AppError("Project file is required.", 400);
  }

  const updated = await updateProject({
    id: projectId,
    title: input.title.trim(),
    description: input.description.trim(),
    fileName: input.fileName.trim(),
    fileUrl: input.fileUrl.trim(),
    type: inferProjectType(input.fileName),
  });

  if (!updated) {
    throw new AppError("Failed to update project.", 500);
  }

  return mapProject(updated);
}
