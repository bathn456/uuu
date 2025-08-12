import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// PlanetScale optimized connection pool configuration
export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10, // Maximum number of connections in the pool
  idleTimeout: 30000, // Close idle connections after 30 seconds
  ssl: {
    rejectUnauthorized: false // Required for PlanetScale connections
  }
});

export const db = drizzle(pool, { 
  schema,
  mode: 'default',
  logger: false // Disable query logging for performance
});
