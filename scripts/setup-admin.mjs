import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [emailArg, passwordArg] = process.argv.slice(2);

if (!emailArg || !passwordArg) {
  console.error(
    "Usage: npm run setup:admin -- <owner-email> <strong-password>"
  );
  console.error(
    "Example: npm run setup:admin -- owner@example.com 'a-long-unique-password'"
  );
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Please provide a valid email address.");
  process.exit(1);
}
if (passwordArg.length < 12) {
  console.error("Please use a password of at least 12 characters.");
  process.exit(1);
}

const envPath = resolve(process.cwd(), ".env.local");
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(passwordArg, salt, 64).toString("hex");
const values = {
  ADMIN_EMAIL: email,
  ADMIN_PASSWORD_HASH: `${salt}:${hash}`,
  AUTH_SECRET: randomBytes(32).toString("hex"),
  AAS_DATABASE_PATH: process.env.AAS_DATABASE_PATH || "./data/shop.sqlite",
};

const previous = existsSync(envPath)
  ? readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => !Object.keys(values).some((key) => line.startsWith(`${key}=`)))
      .filter((line) => line.trim() !== "")
  : [];

const content = [...previous, ...Object.entries(values).map(([key, value]) => `${key}=${value}`)].join("\n") + "\n";
writeFileSync(envPath, content, { mode: 0o600 });

console.log(`Owner access configured for ${email}`);
console.log(`Credentials written to ${envPath} (keep this file private).`);
console.log("Restart the server, then sign in at /admin/login.");
