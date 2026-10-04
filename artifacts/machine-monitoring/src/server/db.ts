import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { schema } from "./schema";

type DatabasePool = { pool: Pool; database: ReturnType<typeof drizzle<typeof schema>> };

const globalDatabase = globalThis as typeof globalThis & {
  machineMonitoringDatabase?: DatabasePool;
};

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum diatur. Tambahkan URL PostgreSQL Neon/Vercel di environment aplikasi.",
    );
  }

  if (!globalDatabase.machineMonitoringDatabase) {
    const pool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 10_000,
    });
    globalDatabase.machineMonitoringDatabase = {
      pool,
      database: drizzle({ client: pool, schema }),
    };
  }

  return globalDatabase.machineMonitoringDatabase.database;
}