import { pool } from "../db/pool.js";
import { AppError } from "../lib/appError.js";
import { toDateOnly } from "../lib/date.js";
import { createActivity } from "../repositories/activityRepository.js";
import {
  createCandidate,
  finalizeElection,
  findCandidateByEmail,
  findCandidateById,
  getElectionByYear,
  getCurrentElection,
  getWinningCandidates,
  incrementCandidateVotes,
  listCandidates,
  listVotesForUser,
  recordVote,
  updateElectionSettings,
} from "../repositories/electionRepository.js";
import { assignOfficerRole, demoteExistingOfficers, findUserRoleAndStatus, findUserSummary } from "../repositories/userRepository.js";

function getTodayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentElectionYear() {
  return new Date().getUTCFullYear();
}

function getElectionYearFromDate(dateValue: string) {
  return Number(dateValue.slice(0, 4));
}

function getDerivedElectionStatus(election: {
  filing_start: string | Date;
  filing_end: string | Date;
  voting_start: string | Date;
  voting_end: string | Date;
  finalized_at?: string | Date | null;
}) {
  const today = getTodayDateOnly();
  const filingStart = toDateOnly(election.filing_start);
  const filingEnd = toDateOnly(election.filing_end);
  const votingStart = toDateOnly(election.voting_start);
  const votingEnd = toDateOnly(election.voting_end);

  if (election.finalized_at || today > votingEnd) {
    return "completed" as const;
  }

  if (today < filingStart) {
    return "upcoming" as const;
  }

  if (today >= filingStart && today <= filingEnd) {
    return "filing" as const;
  }

  if (today >= votingStart && today <= votingEnd) {
    return "voting" as const;
  }

  return "upcoming" as const;
}

async function getActiveElection() {
  const election = await getCurrentElection();
  if (!election) {
    return null;
  }

  if (getDerivedElectionStatus(election) === "completed" && !election.finalized_at) {
    return finalizeElectionIfNeeded(election.id as number);
  }

  return election;
}

async function finalizeElectionIfNeeded(electionId: number) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const lockedElection = await client.query(
      `SELECT id, election_year, filing_start, filing_end, voting_start, voting_end, status, finalized_at
       FROM elections
       WHERE id = $1
       FOR UPDATE`,
      [electionId],
    );

    const election = lockedElection.rows[0];
    if (!election) {
      throw new AppError("Election not found.", 404);
    }

    if (election.finalized_at) {
      await client.query("COMMIT");
      return election;
    }

    if (getDerivedElectionStatus(election) !== "completed") {
      await client.query("COMMIT");
      return election;
    }

    const winners = await getWinningCandidates(election.id as number, client);

    await demoteExistingOfficers(client);
    for (const winner of winners) {
      await assignOfficerRole(winner.email as string, winner.position as string, client);
      await createActivity(winner.name as string, `won the ${winner.position as string} election`, "election", client);
    }

    const finalized = await finalizeElection(election.id as number, client);
    await client.query("COMMIT");
    return finalized;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function parseNameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export async function getElection(email?: string) {
  const election = await getActiveElection();
  if (!election) {
    return {
      election: null,
      candidates: [],
      votedPositions: [],
      votedCandidateIds: [],
    };
  }

  const status = getDerivedElectionStatus(election);
  const candidates = await listCandidates(election.id as number);
  const votes = email ? await listVotesForUser(election.id as number, email) : [];
  const resultsVisible = status === "completed";

  return {
    election: {
      id: election.id,
      year: election.election_year,
      filingStart: toDateOnly(election.filing_start),
      filingEnd: toDateOnly(election.filing_end),
      votingStart: toDateOnly(election.voting_start),
      votingEnd: toDateOnly(election.voting_end),
      status,
      resultsVisible,
    },
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      electionId: candidate.election_id,
      position: candidate.position,
      name: candidate.name,
      email: candidate.email,
      manifesto: candidate.manifesto,
      votes: resultsVisible ? candidate.votes : 0,
    })),
    votedPositions: votes.map((vote) => vote.position),
    votedCandidateIds: votes.map((vote) => vote.candidate_id),
  };
}

export async function fileCandidacy(input: { email: string; position: string; manifesto: string }) {
  if (!input.email || !input.position || !input.manifesto) {
    throw new AppError("Email, position, and manifesto are required.", 400);
  }

  const election = await getActiveElection();
  if (getDerivedElectionStatus(election) !== "filing") {
    throw new AppError("Candidacy filing is currently closed.", 400);
  }

  const user = (await findUserSummary(input.email)) ?? { name: parseNameFromEmail(input.email), email: input.email };
  const existing = await findCandidateByEmail(election.id as number, user.email);
  if (existing) {
    throw new AppError("You already filed candidacy for this year's election.", 409);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const candidate = await createCandidate(
      {
        electionId: election.id as number,
        position: input.position,
        name: user.name,
        email: user.email,
        manifesto: input.manifesto.trim(),
      },
      client,
    );

    await createActivity(user.name, `filed candidacy for ${input.position}`, "election", client);
    await client.query("COMMIT");

    return candidate;
  } catch (error) {
    await client.query("ROLLBACK");
    const maybeError = error as { code?: string };
    if (maybeError.code === "23505") {
      throw new AppError("You already filed candidacy for this year's election.", 409);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function vote(input: { email: string; candidateId: number }) {
  if (!input.email || !input.candidateId) {
    throw new AppError("Email and candidateId are required.", 400);
  }

  const election = await getActiveElection();
  if (getDerivedElectionStatus(election) !== "voting") {
    throw new AppError("Voting is currently closed.", 400);
  }

  const userAccount = await findUserRoleAndStatus(input.email);
  if (!userAccount || userAccount.status !== "active") {
    throw new AppError("Only active members can vote.", 403);
  }

  const candidate = await findCandidateById(election.id as number, input.candidateId);
  if (!candidate) {
    throw new AppError("Candidate not found.", 404);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await recordVote(
      {
        electionId: election.id as number,
        candidateId: candidate.id as number,
        voterEmail: input.email,
        position: candidate.position as string,
      },
      client,
    );
    await incrementCandidateVotes(candidate.id as number, client);
    await createActivity(parseNameFromEmail(input.email), `voted for ${candidate.position as string}`, "vote", client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    const maybeError = error as { code?: string };
    if (maybeError.code === "23505") {
      throw new AppError("You have already voted for this position.", 409);
    }
    throw error;
  } finally {
    client.release();
  }

  return { ok: true as const };
}

export async function saveElectionSettings(input: {
  email: string;
  filingStart: string;
  filingEnd: string;
  votingStart: string;
  votingEnd: string;
}) {
  if (!input.email) {
    throw new AppError("You must be signed in as the president to set the election schedule.", 401);
  }

  if (!input.filingStart || !input.filingEnd || !input.votingStart || !input.votingEnd) {
    throw new AppError("Filing and voting dates are required.", 400);
  }

  const requester = await findUserRoleAndStatus(input.email);
  if (!requester || requester.role !== "president") {
    throw new AppError("Only the president can set the election schedule.", 403);
  }

  if (input.filingStart > input.filingEnd) {
    throw new AppError("Filing start must be on or before filing end.", 400);
  }

  if (input.votingStart > input.votingEnd) {
    throw new AppError("Voting start must be on or before voting end.", 400);
  }

  if (input.filingEnd >= input.votingStart) {
    throw new AppError("Voting must start after candidacy filing ends.", 400);
  }

  const filingYear = getElectionYearFromDate(input.filingStart);
  const filingEndYear = getElectionYearFromDate(input.filingEnd);
  const votingStartYear = getElectionYearFromDate(input.votingStart);
  const votingEndYear = getElectionYearFromDate(input.votingEnd);

  if (filingYear !== filingEndYear || filingYear !== votingStartYear || filingYear !== votingEndYear) {
    throw new AppError("All election dates must be within the same election year.", 400);
  }

  const currentYear = getCurrentElectionYear();
  if (filingYear < currentYear) {
    throw new AppError("Election schedules cannot be created for a past year.", 400);
  }

  const existingElection = await getElectionByYear(filingYear);
  if (existingElection?.finalized_at) {
    throw new AppError(`The ${filingYear} election is already completed and cannot be reopened.`, 409);
  }

  const election = await updateElectionSettings({
    electionYear: filingYear,
    filingStart: input.filingStart,
    filingEnd: input.filingEnd,
    votingStart: input.votingStart,
    votingEnd: input.votingEnd,
    status: "scheduled",
  });
  const status = getDerivedElectionStatus(election);
  return {
    id: election.id,
    year: election.election_year,
    filingStart: toDateOnly(election.filing_start),
    filingEnd: toDateOnly(election.filing_end),
    votingStart: toDateOnly(election.voting_start),
    votingEnd: toDateOnly(election.voting_end),
    status,
    resultsVisible: status === "completed",
  };
}
