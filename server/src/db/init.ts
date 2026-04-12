import { pool } from "./pool.js";

export async function initializeDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      avatar_url TEXT,
      location TEXT NOT NULL DEFAULT '',
      course TEXT NOT NULL DEFAULT '',
      year_level TEXT NOT NULL DEFAULT '',
      contact_number TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS applicant_projects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      attachment_name TEXT NOT NULL DEFAULT '',
      attachment_url TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS classroom_activities (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      deadline DATE,
      points INTEGER NOT NULL DEFAULT 100,
      classroom_id TEXT NOT NULL,
      created_by_email TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      event_date DATE NOT NULL,
      event_time TEXT NOT NULL,
      description TEXT NOT NULL,
      organizer TEXT NOT NULL,
      attendees INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      social_caption TEXT NOT NULL DEFAULT '',
      created_by_email TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      role TEXT NOT NULL,
      type TEXT NOT NULL,
      submitted_at DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      participants JSONB NOT NULL DEFAULT '[]'::jsonb,
      scheduled_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS meeting_rooms (
      id SERIAL PRIMARY KEY,
      room_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      host_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS meeting_room_participants (
      room_code TEXT NOT NULL REFERENCES meeting_rooms(room_code) ON DELETE CASCADE,
      peer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (room_code, peer_id)
    );

    CREATE TABLE IF NOT EXISTS meeting_room_signals (
      id SERIAL PRIMARY KEY,
      room_code TEXT NOT NULL REFERENCES meeting_rooms(room_code) ON DELETE CASCADE,
      from_peer_id TEXT NOT NULL,
      to_peer_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS elections (
      id SERIAL PRIMARY KEY,
      election_year INTEGER NOT NULL UNIQUE,
      filing_start DATE NOT NULL,
      filing_end DATE NOT NULL,
      voting_start DATE NOT NULL,
      voting_end DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'filing',
      finalized_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      election_id INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
      position TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      manifesto TEXT NOT NULL,
      votes INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      election_id INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      voter_email TEXT NOT NULL,
      position TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (election_id, voter_email, position)
    );
  `);

  await pool.query(`
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS election_year INTEGER;
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;
    UPDATE elections
    SET election_year = EXTRACT(YEAR FROM created_at)::int
    WHERE election_year IS NULL;
    ALTER TABLE elections ALTER COLUMN election_year SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS elections_election_year_key
    ON elections (election_year);

    CREATE UNIQUE INDEX IF NOT EXISTS candidates_election_email_position_key
    ON candidates (election_id, email, position);

    CREATE UNIQUE INDEX IF NOT EXISTS candidates_election_email_key
    ON candidates (election_id, email);

    ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS course TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS year_level TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_number TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS project_title TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS project_description TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS project_attachment_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS project_attachment_url TEXT NOT NULL DEFAULT '';
    ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '';
    ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
    ALTER TABLE events ADD COLUMN IF NOT EXISTS social_caption TEXT NOT NULL DEFAULT '';
    ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by_email TEXT NOT NULL DEFAULT '';
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS activity_id INTEGER;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS file_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS file_url TEXT NOT NULL DEFAULT '';
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS submitted_by_email TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    SELECT setval(
      pg_get_serial_sequence('users', 'id'),
      COALESCE((SELECT MAX(id) FROM users), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('applicant_projects', 'id'),
      COALESCE((SELECT MAX(id) FROM applicant_projects), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('activities', 'id'),
      COALESCE((SELECT MAX(id) FROM activities), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('classroom_activities', 'id'),
      COALESCE((SELECT MAX(id) FROM classroom_activities), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('events', 'id'),
      COALESCE((SELECT MAX(id) FROM events), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('projects', 'id'),
      COALESCE((SELECT MAX(id) FROM projects), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('meetings', 'id'),
      COALESCE((SELECT MAX(id) FROM meetings), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('meeting_rooms', 'id'),
      COALESCE((SELECT MAX(id) FROM meeting_rooms), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('meeting_room_signals', 'id'),
      COALESCE((SELECT MAX(id) FROM meeting_room_signals), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('elections', 'id'),
      COALESCE((SELECT MAX(id) FROM elections), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('candidates', 'id'),
      COALESCE((SELECT MAX(id) FROM candidates), 0) + 1,
      false
    );
    SELECT setval(
      pg_get_serial_sequence('votes', 'id'),
      COALESCE((SELECT MAX(id) FROM votes), 0) + 1,
      false
    );
  `);

  await pool.query(`
    INSERT INTO applicant_projects (user_id, title, description, attachment_name, attachment_url)
    SELECT id, project_title, project_description, project_attachment_name, project_attachment_url
    FROM users
    WHERE (
      project_title <> '' OR
      project_description <> '' OR
      project_attachment_name <> '' OR
      project_attachment_url <> ''
    )
    AND NOT EXISTS (
      SELECT 1 FROM applicant_projects WHERE applicant_projects.user_id = users.id
    )
  `);

  await pool.query(`
    ALTER TABLE users DROP COLUMN IF EXISTS project_title;
    ALTER TABLE users DROP COLUMN IF EXISTS project_description;
    ALTER TABLE users DROP COLUMN IF EXISTS project_attachment_name;
    ALTER TABLE users DROP COLUMN IF EXISTS project_attachment_url;
  `);

  await pool.query("DROP TABLE IF EXISTS applicants");
}
