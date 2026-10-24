/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cloud SQL Connection Pool & Drizzle ORM Setup (Project: gen-lang-client-0889094097)
 * Strictly utilizes Object Method for pg Pool with global caching across hot reloads.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

// Global connection pool cache to persist across Vite dev server restarts
declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = (): Pool => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : undefined,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
    });

    // Prevent unhandled pool-level errors from terminating the process
    global._postgresPool.on("error", (err) => {
      // Gentle warning for connection issues during offline/reconnect
      console.warn("Notice: Cloud SQL pool idle state:", err?.message || err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve cached pool instance
export const pool = createPool();

// Initialize Drizzle with connection pool and relational schema
export const db = drizzle(pool, { schema });
