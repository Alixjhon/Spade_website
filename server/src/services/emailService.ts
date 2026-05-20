import nodemailer from "nodemailer";
import { env } from "../config/env.js";

type ApplicantAcceptanceEmailInput = {
  name: string;
  email: string;
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
    console.warn(`Applicant acceptance email skipped. Missing SMTP settings: ${missingSettings.join(", ")}.`);
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

https://spade-website-frontend.onrender.com

Please stay updated through our official communication channels for announcements, onboarding schedules, meetings, and upcoming events.

Welcome to Spade Organization — where innovation, collaboration, and leadership thrive.

If you have any questions, feel free to contact us anytime.

Best regards,
Spade Organization Team`;
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
