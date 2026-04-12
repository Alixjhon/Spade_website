import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";
import type { ClassroomActivityRecord } from "../types/domain.js";

type QueryExecutor = Pick<PoolClient, "query">;

export async function createActivity(
  userName: string,
  action: string,
  type: string,
  executor: QueryExecutor = pool,
): Promise<void> {
  await executor.query("INSERT INTO activities (user_name, action, type) VALUES ($1, $2, $3)", [userName, action, type]);
}

export async function listRecentActivities(): Promise<Array<{ id: number; user_name: string; action: string; type: string; created_at: string }>> {
  const result = await pool.query(
    "SELECT id, user_name, action, type, created_at FROM activities ORDER BY created_at DESC LIMIT 8",
  );
  return result.rows as Array<{ id: number; user_name: string; action: string; type: string; created_at: string }>;
}

const classroomActivitySelect = `
  SELECT
    id,
    title,
    description,
    deadline,
    points,
    classroom_id,
    created_by_email,
    created_at
  FROM classroom_activities
`;

export async function listActivities(): Promise<ClassroomActivityRecord[]> {
  const result = await pool.query(`${classroomActivitySelect} ORDER BY created_at DESC, id DESC`);
  return result.rows as ClassroomActivityRecord[];
}

export async function findActivityById(id: number): Promise<ClassroomActivityRecord | null> {
  const result = await pool.query(`${classroomActivitySelect} WHERE id = $1 LIMIT 1`, [id]);
  return (result.rows[0] as ClassroomActivityRecord | undefined) ?? null;
}

export async function createClassroomActivity(data: {
  title: string;
  description: string;
  deadline: string | null;
  points: number;
  classroomId: string;
  createdByEmail: string;
}): Promise<ClassroomActivityRecord> {
  const result = await pool.query(
    `INSERT INTO classroom_activities 
    (title, description, deadline, points, classroom_id, created_by_email)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      title,
      description,
      deadline,
      points,
      classroom_id,
      created_by_email,
      created_at`,
    [data.title, data.description, data.deadline, data.points, data.classroomId, data.createdByEmail],
  );
  return result.rows[0] as ClassroomActivityRecord;
}
