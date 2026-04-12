import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";

type QueryExecutor = Pick<PoolClient, "query">;

export async function getCurrentElection() {
  const result = await pool.query(
    `SELECT id, election_year, filing_start, filing_end, voting_start, voting_end, status, finalized_at
     FROM elections
     ORDER BY election_year DESC, id DESC
     LIMIT 1`,
  );
  return result.rows[0];
}

export async function getElectionByYear(electionYear: number, executor: QueryExecutor = pool) {
  const result = await executor.query(
    `SELECT id, election_year, filing_start, filing_end, voting_start, voting_end, status, finalized_at
     FROM elections
     WHERE election_year = $1
     LIMIT 1`,
    [electionYear],
  );
  return result.rows[0] ?? null;
}

export async function listCandidates(electionId: number) {
  const result = await pool.query(
    `SELECT id, election_id, position, name, email, manifesto, votes, created_at
     FROM candidates
     WHERE election_id = $1
     ORDER BY position, votes DESC, name ASC`,
    [electionId],
  );
  return result.rows;
}

export async function listVotesForUser(electionId: number, voterEmail: string) {
  const result = await pool.query(
    "SELECT position, candidate_id FROM votes WHERE election_id = $1 AND voter_email = $2",
    [electionId, voterEmail],
  );
  return result.rows;
}

export async function findCandidateById(electionId: number, candidateId: number) {
  const result = await pool.query(
    "SELECT id, name, position FROM candidates WHERE id = $1 AND election_id = $2 LIMIT 1",
    [candidateId, electionId],
  );
  return result.rows[0] ?? null;
}

export async function findCandidateByEmailAndPosition(electionId: number, email: string, position: string) {
  const result = await pool.query(
    "SELECT id FROM candidates WHERE election_id = $1 AND email = $2 AND position = $3 LIMIT 1",
    [electionId, email, position],
  );
  return result.rows[0] ?? null;
}

export async function findCandidateByEmail(electionId: number, email: string) {
  const result = await pool.query(
    "SELECT id, position FROM candidates WHERE election_id = $1 AND email = $2 LIMIT 1",
    [electionId, email],
  );
  return result.rows[0] ?? null;
}

export async function createCandidate(input: {
  electionId: number;
  position: string;
  name: string;
  email: string;
  manifesto: string;
}, executor: QueryExecutor = pool) {
  const result = await executor.query(
    `INSERT INTO candidates (election_id, position, name, email, manifesto, votes)
     VALUES ($1, $2, $3, $4, $5, 0)
     RETURNING id, election_id, position, name, email, manifesto, votes`,
    [input.electionId, input.position, input.name, input.email, input.manifesto],
  );
  return result.rows[0];
}

export async function recordVote(input: {
  electionId: number;
  candidateId: number;
  voterEmail: string;
  position: string;
}, executor: QueryExecutor = pool) {
  await executor.query(
    `INSERT INTO votes (election_id, candidate_id, voter_email, position)
     VALUES ($1, $2, $3, $4)`,
    [input.electionId, input.candidateId, input.voterEmail, input.position],
  );
}

export async function incrementCandidateVotes(candidateId: number, executor: QueryExecutor = pool) {
  await executor.query("UPDATE candidates SET votes = votes + 1 WHERE id = $1", [candidateId]);
}

export async function updateElectionSettings(input: {
  electionYear: number;
  filingStart: string;
  filingEnd: string;
  votingStart: string;
  votingEnd: string;
  status: string;
}) {
  const result = await pool.query(
    `INSERT INTO elections (election_year, filing_start, filing_end, voting_start, voting_end, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (election_year) DO UPDATE
     SET filing_start = EXCLUDED.filing_start,
         filing_end = EXCLUDED.filing_end,
         voting_start = EXCLUDED.voting_start,
         voting_end = EXCLUDED.voting_end,
         status = EXCLUDED.status
     RETURNING id, election_year, filing_start, filing_end, voting_start, voting_end, status, finalized_at`,
    [input.electionYear, input.filingStart, input.filingEnd, input.votingStart, input.votingEnd, input.status],
  );
  return result.rows[0];
}

export async function getWinningCandidates(electionId: number, executor: QueryExecutor = pool) {
  const result = await executor.query(
    `SELECT DISTINCT ON (position) id, election_id, position, name, email, manifesto, votes, created_at
     FROM candidates
     WHERE election_id = $1
     ORDER BY position, votes DESC, created_at ASC, id ASC`,
    [electionId],
  );
  return result.rows;
}

export async function finalizeElection(electionId: number, executor: QueryExecutor = pool) {
  const result = await executor.query(
    `UPDATE elections
     SET status = 'completed', finalized_at = NOW()
     WHERE id = $1
     RETURNING id, election_year, filing_start, filing_end, voting_start, voting_end, status, finalized_at`,
    [electionId],
  );
  return result.rows[0];
}
