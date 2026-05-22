import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { listActiveUsers } from "../repositories/userRepository.js";

type ApplicantAcceptanceEmailInput = {
  name: string;
  email: string;
};

type MeetingStartedEmailInput = {
  title: string;
  roomId: string;
  hostName: string;
};

function createTransporter() {
  const missingSettings = [
    ["SMTP_HOST", env.smtpHost],
    ["SMTP_PORT", env.smtpPort],
    ["SMTP_USER", env.smtpUser],
    ["SMTP_PASS", env.smtpPass],
    ["MAIL_FROM", env.mailFrom],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingSettings.length > 0) {
    console.warn(`Email skipped. Missing SMTP settings: ${missingSettings.join(", ")}.`);
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

function buildApplicantAcceptanceMessage(name: string) {
  return `Dear ${name},

Greetings from Spade Organization!

We are pleased to inform you that your application has been officially accepted. After carefully reviewing your submission, we are excited to welcome you as a member of the Spade community.

Your skills, passion, and willingness to grow align with the values and mission of our organization. We believe that you will become a valuable part of our team and contribute meaningfully to future projects and activities.

You may now access the official Spade Portal using the link below:

https://spade-website-frontend.onrender.com/#/dashboard

Please stay updated through our official communication channels for announcements, onboarding schedules, meetings, and upcoming events.

Welcome to Spade Organization — where innovation, collaboration, and leadership thrive.

If you have any questions, feel free to contact us anytime.

Best regards,
Spade Organization Team`;
}

function buildMeetingStartedMessage(input: MeetingStartedEmailInput) {
  const meetingLink = `${env.appBaseUrl.replace(/\/$/, "")}/#/dashboard/meetings?room=${encodeURIComponent(input.roomId)}`;

  return `Dear SPADE Officers,

Good day!

The meeting for the SPADE Organization will officially begin shortly. Please click the link below to join the meeting room.

Meeting Link: ${meetingLink}

Your attendance and participation are highly appreciated. Please join on time and be prepared for the discussion.

Thank you, and see you there!

Best regards,
${input.hostName}
SPADE Organization`;
}

export async function sendApplicantAcceptanceEmail(input: ApplicantAcceptanceEmailInput) {
  const transporter = createTransporter();

  if (!transporter) {
    return;
  }

  await transporter.sendMail({
    from: env.mailFrom,
    to: input.email,
    subject: "Your Spade Organization Application Has Been Accepted",
    text: buildApplicantAcceptanceMessage(input.name),
  });
}

export async function sendMeetingStartedEmailToActiveUsers(input: MeetingStartedEmailInput) {
  const transporter = createTransporter();

  if (!transporter) {
    return;
  }

  const users = await listActiveUsers();
  const recipients = users.map((user) => user.email).filter(Boolean);

  if (recipients.length === 0) {
    return;
  }

  await transporter.sendMail({
    from: env.mailFrom,
    to: env.mailFrom,
    bcc: recipients,
    subject: `SPADE Meeting Starting Soon: ${input.title}`,
    text: buildMeetingStartedMessage(input),
  });
}
