import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema.js";

// Set a default DATABASE_URL for development if not provided
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost:5432/deeplearning_dev";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// PostgreSQL connection for development (MySQL schema ready for PlanetScale)
export const connection = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(connection, { 
  schema,
  logger: false
});
