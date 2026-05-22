import { pool } from "../db/pool.js";

export type NotificationRecord = {
  id: number;
  user_email: string;
  type: string;
  title: string;
  message: string;
  action_url: string;
  read_at: Date | string | null;
  created_at: Date | string;
};

export async function createNotificationForActiveUsers(input: {
  type: string;
  title: string;
  message: string;
  actionUrl: string;
}) {
  await pool.query(
    `INSERT INTO notifications (user_email, type, title, message, action_url)
     SELECT email, $1, $2, $3, $4
     FROM users
     WHERE status = 'active'`,
    [input.type, input.title, input.message, input.actionUrl],
  );
}

export async function listUnreadNotificationsForUser(userEmail: string) {
  const result = await pool.query<NotificationRecord>(
    `SELECT id, user_email, type, title, message, action_url, read_at, created_at
     FROM notifications
     WHERE user_email = $1 AND read_at IS NULL
     ORDER BY created_at ASC, id ASC
     LIMIT 20`,
    [userEmail],
  );

  return result.rows;
}

export async function markNotificationRead(input: {
  id: number;
  userEmail: string;
}) {
  const result = await pool.query<{ id: number }>(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE id = $1 AND user_email = $2
     RETURNING id`,
    [input.id, input.userEmail],
  );

  return Boolean(result.rows[0]);
}
