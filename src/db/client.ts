import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

export function createDatabase() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required when the PostgreSQL repository is enabled.");
  }
  const client = postgres(databaseUrl, { max: 10, prepare: false });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
