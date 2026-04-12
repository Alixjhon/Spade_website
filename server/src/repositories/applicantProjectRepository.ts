import { pool } from "../db/pool.js";

export async function createApplicantProject(input: {
  userId: number;
  title: string;
  description: string;
  attachmentName: string;
  attachmentUrl: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO applicant_projects (user_id, title, description, attachment_name, attachment_url)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.userId, input.title, input.description, input.attachmentName, input.attachmentUrl],
  );
}
