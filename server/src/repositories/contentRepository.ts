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
    `SELECT id, title, description, role, type, submitted_at, activity_id, file_name, file_url, submitted_by_email
     FROM projects
     ORDER BY submitted_at DESC, id DESC`,
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
    RETURNING id, title, description, role, type, submitted_at, activity_id, file_name, file_url, submitted_by_email`,
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

export async function getLatestMeeting() {
  const result = await pool.query(
    "SELECT id, title, status, participants, scheduled_at FROM meetings ORDER BY scheduled_at DESC LIMIT 1",
  );
  return result.rows[0] ?? null;
}
