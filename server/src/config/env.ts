function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("Missing or invalid environment variable: PORT");
}

export const env = {
  port,
  databaseUrl: requireEnv("DATABASE_URL"),
  allowedEmailDomain: requireEnv("ALLOWED_EMAIL_DOMAIN"),
  defaultPassword: requireEnv("DEFAULT_PASSWORD"),
} as const;
