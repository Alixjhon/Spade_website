import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";
import type { ClassroomActivityRecord, DashboardActivityRecord } from "../types/domain.js";

type QueryExecutor = Pick<PoolClient, "query">;

export async function createActivity(
  userName: string,
  action: string,
  type: string,
  executor: QueryExecutor = pool,
): Promise<void> {
  await executor.query("INSERT INTO activities (user_name, action, type) VALUES ($1, $2, $3)", [userName, action, type]);
}

export async function listRecentActivities(): Promise<DashboardActivityRecord[]> {
  const result = await pool.query(
    `SELECT
       dashboard_activity_feed.id,
       COALESCE(matched_user.name, dashboard_activity_feed.user_name) AS user_name,
       dashboard_activity_feed.action,
       dashboard_activity_feed.type,
       dashboard_activity_feed.created_at,
       COALESCE(matched_user.avatar_url, dashboard_activity_feed.profile_picture_url) AS profile_picture_url
     FROM (
       SELECT
          CONCAT('user-', users.id) AS id,
          users.name AS user_name,
          users.email AS actor_email,
          users.name AS actor_name,
          CASE
            WHEN users.status = 'pending' THEN 'submitted membership application'
            ELSE 'joined SPADE'
         END AS action,
         CASE
           WHEN users.status = 'pending' THEN 'applicant'
           ELSE 'member'
         END AS type,
         users.created_at,
         users.avatar_url AS profile_picture_url
       FROM users

       UNION ALL

       SELECT
          CONCAT('candidate-', candidates.id) AS id,
          candidates.name AS user_name,
          candidates.email AS actor_email,
          candidates.name AS actor_name,
          CONCAT('filed candidacy for ', candidates.position) AS action,
          'election' AS type,
          candidates.created_at,
          '' AS profile_picture_url
       FROM candidates

       UNION ALL

       SELECT
          CONCAT('vote-', votes.id) AS id,
          votes.voter_email AS user_name,
          votes.voter_email AS actor_email,
          '' AS actor_name,
          CONCAT('voted for ', votes.position) AS action,
          'vote' AS type,
          votes.created_at,
          '' AS profile_picture_url
       FROM votes

       UNION ALL

       SELECT
          CONCAT('event-', events.id) AS id,
         CASE
            WHEN events.created_by_email <> '' THEN events.created_by_email
            ELSE events.organizer
          END AS user_name,
          events.created_by_email AS actor_email,
          events.organizer AS actor_name,
          CONCAT('created event: ', events.title) AS action,
          'event' AS type,
          events.created_at,
          '' AS profile_picture_url
       FROM events

       UNION ALL

       SELECT
          CONCAT('project-', projects.id) AS id,
          projects.submitted_by_email AS user_name,
          projects.submitted_by_email AS actor_email,
          '' AS actor_name,
          CONCAT('submitted project: ', projects.title) AS action,
          'project' AS type,
          projects.created_at,
          '' AS profile_picture_url
       FROM projects

       UNION ALL

       SELECT
          CONCAT('assignment-', classroom_activities.id) AS id,
          classroom_activities.created_by_email AS user_name,
          classroom_activities.created_by_email AS actor_email,
          '' AS actor_name,
          CONCAT('assigned activity: ', classroom_activities.title) AS action,
          'activity' AS type,
          classroom_activities.created_at,
          '' AS profile_picture_url
       FROM classroom_activities

       UNION ALL

       SELECT
          CONCAT('meeting-room-', meeting_rooms.id) AS id,
          meeting_rooms.host_name AS user_name,
          '' AS actor_email,
          meeting_rooms.host_name AS actor_name,
          CONCAT('opened meeting room: ', meeting_rooms.title) AS action,
          'meeting' AS type,
          meeting_rooms.created_at,
          '' AS profile_picture_url
       FROM meeting_rooms
     ) AS dashboard_activity_feed
     LEFT JOIN LATERAL (
       SELECT users.name, users.avatar_url
       FROM users
       WHERE (
         dashboard_activity_feed.actor_email <> ''
         AND LOWER(users.email) = LOWER(dashboard_activity_feed.actor_email)
       ) OR (
         dashboard_activity_feed.actor_email = ''
         AND dashboard_activity_feed.actor_name <> ''
         AND LOWER(TRIM(users.name)) = LOWER(TRIM(dashboard_activity_feed.actor_name))
       )
       ORDER BY CASE
         WHEN dashboard_activity_feed.actor_email <> '' AND LOWER(users.email) = LOWER(dashboard_activity_feed.actor_email) THEN 0
         ELSE 1
       END,
       users.id DESC
       LIMIT 1
     ) AS matched_user ON TRUE
     ORDER BY created_at DESC
     LIMIT 8`,
  );
  return result.rows as DashboardActivityRecord[];
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
