import crypto from "node:crypto";
import { env } from "../config/env.js";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface TokenPayload {
  email: string;
  role: string;
  name: string;
  exp: number;
  iat: number;
}

interface JwtHeader {
  alg: "HS256";
  typ: "JWT";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", env.jwtSecret).update(value).digest("base64url");
}

export function createAuthToken(input: { email: string; role: string; name: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header: JwtHeader = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload: TokenPayload = {
    email: input.email,
    role: input.role,
    name: input.name,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signedValue = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(signedValue);
  return `${signedValue}.${signature}`;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = tokenParts;

  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const header = JSON.parse(fromBase64Url(encodedHeader)) as JwtHeader;
    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null;
    }

    const payload = JSON.parse(fromBase64Url(encodedPayload)) as TokenPayload;

    if (!payload.email || !payload.role || !payload.name || !payload.iat || !payload.exp) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
