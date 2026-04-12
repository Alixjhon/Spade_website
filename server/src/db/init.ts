import { env } from "../config/env.js";
import { pool } from "./pool.js";
import { seedActivities, seedApplicants, seedCandidates, seedEvents, seedMeetings, seedProjects, seedUsers } from "./seeds.js";

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

  await pool.query(
    `INSERT INTO users (name, email, password, role, status, avatar_url, location, course, year_level, contact_number)
     SELECT * FROM UNNEST ($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[], $10::text[])
     ON CONFLICT (email) DO NOTHING`,
    [
      seedUsers.map((item) => item.name),
      seedUsers.map((item) => item.email),
      seedUsers.map(() => env.defaultPassword),
      seedUsers.map((item) => item.role),
      seedUsers.map(() => "active"),
      seedUsers.map(() => ""),
      seedUsers.map(() => ""),
      seedUsers.map(() => ""),
      seedUsers.map(() => ""),
      seedUsers.map(() => ""),
    ],
  );

  await pool.query(
    `INSERT INTO users (name, email, password, role, status, avatar_url, location, course, year_level, contact_number)
     SELECT * FROM UNNEST ($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[], $10::text[])
     ON CONFLICT (email) DO NOTHING`,
    [
      seedApplicants.map((item) => item.name),
      seedApplicants.map((item) => item.email),
      seedApplicants.map(() => env.defaultPassword),
      seedApplicants.map((item) => item.role),
      seedApplicants.map((item) => item.status),
      seedApplicants.map((item) => item.profilePictureUrl),
      seedApplicants.map((item) => item.location),
      seedApplicants.map((item) => item.course),
      seedApplicants.map((item) => item.yearLevel),
      seedApplicants.map((item) => item.contactNumber),
    ],
  );

  for (const applicant of seedApplicants) {
    await pool.query(
      `INSERT INTO applicant_projects (user_id, title, description, attachment_name, attachment_url)
       SELECT id, $2, $3, $4, $5
       FROM users
       WHERE email = $1
       ON CONFLICT (user_id) DO NOTHING`,
      [
        applicant.email,
        applicant.projectTitle,
        applicant.projectDescription,
        applicant.projectAttachmentName,
        applicant.projectAttachmentUrl,
      ],
    );
  }

  await pool.query("DROP TABLE IF EXISTS applicants");

  const activitiesCount = await pool.query("SELECT COUNT(*)::int AS count FROM activities");
  if (activitiesCount.rows[0].count === 0) {
    await pool.query(
      `INSERT INTO activities (user_name, action, type, created_at)
       SELECT * FROM UNNEST ($1::text[], $2::text[], $3::text[], $4::timestamptz[])`,
      [
        seedActivities.map((item) => item.user_name),
        seedActivities.map((item) => item.action),
        seedActivities.map((item) => item.type),
        seedActivities.map((item) => item.created_at),
      ],
    );
  }

  const eventsCount = await pool.query("SELECT COUNT(*)::int AS count FROM events");
  if (eventsCount.rows[0].count === 0) {
    await pool.query(
      `INSERT INTO events (title, event_date, event_time, description, organizer, attendees, category, location, image_url, social_caption, created_by_email)
       SELECT * FROM UNNEST ($1::text[], $2::date[], $3::text[], $4::text[], $5::text[], $6::int[], $7::text[], $8::text[], $9::text[], $10::text[], $11::text[])`,
      [
        seedEvents.map((item) => item.title),
        seedEvents.map((item) => item.event_date),
        seedEvents.map((item) => item.event_time),
        seedEvents.map((item) => item.description),
        seedEvents.map((item) => item.organizer),
        seedEvents.map((item) => item.attendees),
        seedEvents.map((item) => item.category),
        seedEvents.map((item) => item.organizer),
        seedEvents.map(() => ""),
        seedEvents.map((item) => `${item.title} is happening soon. Join SPADE for updates and event details.`),
        seedEvents.map(() => ""),
      ],
    );
  }

  const projectsCount = await pool.query("SELECT COUNT(*)::int AS count FROM projects");
  if (projectsCount.rows[0].count === 0) {
    await pool.query(
      `INSERT INTO projects (title, description, role, type, submitted_at)
       SELECT * FROM UNNEST ($1::text[], $2::text[], $3::text[], $4::text[], $5::date[])`,
      [
        seedProjects.map((item) => item.title),
        seedProjects.map((item) => item.description),
        seedProjects.map((item) => item.role),
        seedProjects.map((item) => item.type),
        seedProjects.map((item) => item.submitted_at),
      ],
    );
  }

  const meetingsCount = await pool.query("SELECT COUNT(*)::int AS count FROM meetings");
  if (meetingsCount.rows[0].count === 0) {
    await pool.query(
      `INSERT INTO meetings (title, status, participants, scheduled_at)
       SELECT * FROM UNNEST ($1::text[], $2::text[], $3::jsonb[], $4::timestamptz[])`,
      [
        seedMeetings.map((item) => item.title),
        seedMeetings.map((item) => item.status),
        seedMeetings.map((item) => item.participants),
        seedMeetings.map((item) => item.scheduled_at),
      ],
    );
  }

  let electionId: number;
  const electionCount = await pool.query("SELECT COUNT(*)::int AS count FROM elections");
  if (electionCount.rows[0].count === 0) {
    const insertedElection = await pool.query(
      `INSERT INTO elections (election_year, filing_start, filing_end, voting_start, voting_end, status)
       VALUES (2026, '2026-04-01', '2026-04-15', '2026-04-16', '2026-04-30', 'filing')
       RETURNING id`,
    );
    electionId = insertedElection.rows[0].id as number;
  } else {
    const existingElection = await pool.query("SELECT id FROM elections ORDER BY id DESC LIMIT 1");
    electionId = existingElection.rows[0].id as number;
  }

  const candidatesCount = await pool.query("SELECT COUNT(*)::int AS count FROM candidates");
  if (candidatesCount.rows[0].count === 0) {
    await pool.query(
      `INSERT INTO candidates (election_id, position, name, email, manifesto, votes)
       SELECT * FROM UNNEST ($1::int[], $2::text[], $3::text[], $4::text[], $5::text[], $6::int[])`,
      [
        seedCandidates.map(() => electionId),
        seedCandidates.map((item) => item.position),
        seedCandidates.map((item) => item.name),
        seedCandidates.map((item) => item.email),
        seedCandidates.map((item) => item.manifesto),
        seedCandidates.map((item) => item.votes),
      ],
    );
  }
}
