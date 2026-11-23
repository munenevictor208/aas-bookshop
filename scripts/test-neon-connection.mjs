import { existsSync } from "node:fs";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const connectionString = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is missing.");

const client = new pg.Client({ connectionString });
await client.connect();
const result = await client.query("SELECT current_database() AS database, version() AS version");
console.log(`Connected to Neon database: ${result.rows[0].database}`);
console.log(result.rows[0].version.split(",")[0]);
await client.end();
