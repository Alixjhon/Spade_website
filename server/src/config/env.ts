function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name: string) {
  return process.env[name]?.trim() || undefined;
}

const port = Number(process.env.PORT);
const smtpPort = optionalEnv("SMTP_PORT") ? Number(optionalEnv("SMTP_PORT")) : undefined;

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("Missing or invalid environment variable: PORT");
}

if (smtpPort !== undefined && (!Number.isInteger(smtpPort) || smtpPort <= 0)) {
  throw new Error("SMTP_PORT must be a valid positive number.");
}

export const env = {
  port,
  databaseUrl: requireEnv("DATABASE_URL"),
  allowedEmailDomain: requireEnv("ALLOWED_EMAIL_DOMAIN"),
  defaultPassword: requireEnv("DEFAULT_PASSWORD"),
  smtpHost: optionalEnv("SMTP_HOST"),
  smtpPort,
  smtpUser: optionalEnv("SMTP_USER"),
  smtpPass: optionalEnv("SMTP_PASS"),
  mailFrom: optionalEnv("MAIL_FROM") ?? optionalEnv("SMTP_USER"),
} as const;
