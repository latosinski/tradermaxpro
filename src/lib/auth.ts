import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");

const ADMIN_PASSWORD = "latosinski";

export interface TokenRecord {
  token: string;
  clientName: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(TOKENS_FILE)) {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function generateToken(minutes: number, clientName: string): TokenRecord {
  ensureDataFile();

  const rawData = fs.readFileSync(TOKENS_FILE, "utf-8");
  const tokens: TokenRecord[] = JSON.parse(rawData);

  const token = crypto.randomBytes(16).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + minutes * 60 * 1000);

  const record: TokenRecord = {
    token,
    clientName,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    used: false,
  };

  tokens.push(record);
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf-8");

  return record;
}

export function validateToken(token: string): {
  valid: boolean;
  message: string;
} {
  ensureDataFile();

  const rawData = fs.readFileSync(TOKENS_FILE, "utf-8");
  const tokens: TokenRecord[] = JSON.parse(rawData);

  const record = tokens.find((t) => t.token === token);

  if (!record) {
    return { valid: false, message: "Token inválido." };
  }

  if (record.used) {
    return { valid: false, message: "Token já utilizado." };
  }

  const now = new Date();
  const expiresAt = new Date(record.expiresAt);

  if (now > expiresAt) {
    return { valid: false, message: "Token expirado." };
  }

  record.used = true;
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf-8");

  return {
    valid: true,
    message: `Download liberado para ${record.clientName}.`,
  };
}