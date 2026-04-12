import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";
import type { ApplicantRecord, AuthenticatedUser } from "../types/domain.js";

type QueryExecutor = Pick<PoolClient, "query">;

const userProfileSelect = `
  SELECT
    id,
    name,
    email,
    role,
    location,
    course,
    year_level AS "yearLevel",
    contact_number AS "contactNumber",
    avatar_url AS "profilePictureUrl"
  FROM users
`;

const applicantSelect = `
  SELECT
    users.id,
    users.name,
    users.email,
    users.role,
    users.location,
    users.course,
    users.year_level,
    users.contact_number,
    users.avatar_url AS profile_picture_url,
    applicant_projects.title AS project_title,
    applicant_projects.description AS project_description,
    applicant_projects.attachment_name AS project_attachment_name,
    applicant_projects.attachment_url AS project_attachment_url,
    users.status,
    users.created_at AS applied_at
  FROM users
  LEFT JOIN applicant_projects ON applicant_projects.user_id = users.id
`;

export async function findUserForLogin(email: string): Promise<(AuthenticatedUser & { password: string; status: string }) | null> {
  const result = await pool.query(
    `SELECT
       id,
       name,
       email,
       password,
       role,
       status,
       location,
       course,
       year_level AS "yearLevel",
       contact_number AS "contactNumber",
       avatar_url AS "profilePictureUrl"
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );
  return (result.rows[0] as (AuthenticatedUser & { password: string; status: string }) | undefined) ?? null;
}

export async function findUserSummary(email: string): Promise<AuthenticatedUser | null> {
  const result = await pool.query(`${userProfileSelect} WHERE email = $1 LIMIT 1`, [email]);
  return (result.rows[0] as AuthenticatedUser | undefined) ?? null;
}

export async function findUserRoleAndStatus(email: string): Promise<{ id: number; name: string; email: string; role: string; status: string } | null> {
  const result = await pool.query(
    `SELECT id, name, email, role, status
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  return (result.rows[0] as { id: number; name: string; email: string; role: string; status: string } | undefined) ?? null;
}

export async function demoteExistingOfficers(executor: QueryExecutor = pool): Promise<void> {
  await executor.query(
    `UPDATE users
     SET role = 'member'
     WHERE role IN ('president', 'vice-president', 'secretary', 'asst-secretary', 'treasurer', 'pio')`,
  );
}

export async function assignOfficerRole(email: string, role: string, executor: QueryExecutor = pool): Promise<void> {
  await executor.query(
    `UPDATE users
     SET role = $2, status = 'active'
     WHERE email = $1`,
    [email, role],
  );
}

export async function updateUserProfileByEmail(input: {
  email: string;
  name: string;
  location: string;
  course: string;
  yearLevel: string;
  contactNumber: string;
  profilePictureUrl: string;
}): Promise<AuthenticatedUser | null> {
  const result = await pool.query(
    `UPDATE users
     SET
       name = $2,
       location = $3,
       course = $4,
       year_level = $5,
       contact_number = $6,
       avatar_url = $7
     WHERE email = $1
     RETURNING
       id,
       name,
       email,
       role,
       location,
       course,
       year_level AS "yearLevel",
       contact_number AS "contactNumber",
       avatar_url AS "profilePictureUrl"`,
    [
      input.email,
      input.name,
      input.location,
      input.course,
      input.yearLevel,
      input.contactNumber,
      input.profilePictureUrl,
    ],
  );

  return (result.rows[0] as AuthenticatedUser | undefined) ?? null;
}

export async function createPendingUser(input: {
  name: string;
  email: string;
  password: string;
  role: string;
  location: string;
  course: string;
  yearLevel: string;
  contactNumber: string;
  profilePictureUrl: string;
}): Promise<number> {
  const result = await pool.query(
    `INSERT INTO users (
       name, email, password, role, status, location, course, year_level, contact_number, avatar_url
     )
     VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      input.name,
      input.email,
      input.password,
      input.role,
      input.location,
      input.course,
      input.yearLevel,
      input.contactNumber,
      input.profilePictureUrl,
    ],
  );
  return result.rows[0].id as number;
}

export async function listPendingApplicants(): Promise<ApplicantRecord[]> {
  const result = await pool.query(`${applicantSelect} WHERE users.status = 'pending' ORDER BY users.created_at DESC, users.id DESC`);
  return result.rows as ApplicantRecord[];
}

export async function findApplicantById(id: number): Promise<ApplicantRecord | null> {
  const result = await pool.query(`${applicantSelect} WHERE users.id = $1 LIMIT 1`, [id]);
  return (result.rows[0] as ApplicantRecord | undefined) ?? null;
}

export async function updateUserStatus(id: number, status: "active" | "rejected"): Promise<void> {
  await pool.query("UPDATE users SET status = $1 WHERE id = $2", [status, id]);
}

export async function countActiveUsers(): Promise<number> {
  const result = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE status = 'active'");
  return result.rows[0].count as number;
}

export async function countPendingUsers(): Promise<number> {
  const result = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE status = 'pending'");
  return result.rows[0].count as number;
}
