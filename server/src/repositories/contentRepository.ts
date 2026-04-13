import { pool } from "../db/pool.js";
import type { CreateEventInput, CreateProjectInput, EventRecord, ProjectRecord } from "../types/domain.js";

export async function countProjects(): Promise<number> {
  const result = await pool.query("SELECT COUNT(*)::int AS count FROM projects");
  return result.rows[0].count as number;
}

export async function countUpcomingEvents(): Promise<number> {
  const result = await pool.query("SELECT COUNT(*)::int AS count FROM events WHERE event_date >= CURRENT_DATE");
  return result.rows[0].count as number;
}

export async function listEvents() {
  const result = await pool.query(
    `SELECT id, title, event_date, event_time, description, organizer, attendees, category, location, image_url, social_caption, created_by_email
     FROM events
     ORDER BY event_date ASC, id ASC`,
  );
  return result.rows as EventRecord[];
}

export async function createEvent(input: CreateEventInput) {
  const result = await pool.query(
    `INSERT INTO events (
      title,
      event_date,
      event_time,
      description,
      organizer,
      attendees,
      category,
      location,
      image_url,
      social_caption,
      created_by_email
    )
    VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10)
    RETURNING id, title, event_date, event_time, description, organizer, attendees, category, location, image_url, social_caption, created_by_email`,
    [
      input.title,
      input.date,
      input.time,
      input.description,
      input.organizer,
      input.category,
      input.location,
      input.imageUrl,
      input.socialCaption,
      input.createdByEmail,
    ],
  );

  return result.rows[0] as EventRecord;
}

export async function listProjects() {
  const result = await pool.query(
    `SELECT
       projects.id,
       projects.title,
       projects.description,
       projects.role,
       projects.type,
       projects.submitted_at,
       projects.activity_id,
       classroom_activities.title AS activity_title,
       projects.file_name,
       projects.file_url,
       projects.submitted_by_email
     FROM projects
     LEFT JOIN classroom_activities ON classroom_activities.id = projects.activity_id
     ORDER BY projects.submitted_at DESC, projects.id DESC`,
  );
  return result.rows as ProjectRecord[];
}

export async function createProject(input: CreateProjectInput & { role: string; type: string }) {
  const result = await pool.query(
    `INSERT INTO projects (
      title,
      description,
      role,
      type,
      submitted_at,
      activity_id,
      file_name,
      file_url,
      submitted_by_email
    )
    VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8)
    RETURNING
      id,
      title,
      description,
      role,
      type,
      submitted_at,
      activity_id,
      NULL::text AS activity_title,
      file_name,
      file_url,
      submitted_by_email`,
    [
      input.title,
      input.description,
      input.role,
      input.type,
      input.activityId,
      input.fileName,
      input.fileUrl,
      input.submittedByEmail,
    ],
  );

  return result.rows[0] as ProjectRecord;
}

export async function findProjectById(id: number) {
  const result = await pool.query(
    `SELECT
       projects.id,
       projects.title,
       projects.description,
       projects.role,
       projects.type,
       projects.submitted_at,
       projects.activity_id,
       classroom_activities.title AS activity_title,
       projects.file_name,
       projects.file_url,
       projects.submitted_by_email
     FROM projects
     LEFT JOIN classroom_activities ON classroom_activities.id = projects.activity_id
     WHERE projects.id = $1
     LIMIT 1`,
    [id],
  );

  return (result.rows[0] as ProjectRecord | undefined) ?? null;
}

export async function updateProject(input: {
  id: number;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  type: string;
}): Promise<ProjectRecord | null> {
  const result = await pool.query(
    `UPDATE projects
     SET
       title = $2,
       description = $3,
       file_name = $4,
       file_url = $5,
       type = $6
     WHERE id = $1
     RETURNING
       id,
       title,
       description,
       role,
       type,
       submitted_at,
       activity_id,
       NULL::text AS activity_title,
       file_name,
       file_url,
       submitted_by_email`,
    [input.id, input.title, input.description, input.fileName, input.fileUrl, input.type],
  );

  return (result.rows[0] as ProjectRecord | undefined) ?? null;
}

export async function getLatestMeeting() {
  const result = await pool.query(
    "SELECT id, title, status, participants, scheduled_at FROM meetings ORDER BY scheduled_at DESC LIMIT 1",
  );
  return result.rows[0] ?? null;
}
