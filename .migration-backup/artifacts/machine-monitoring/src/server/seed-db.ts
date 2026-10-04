import "dotenv/config";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { schema } from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL wajib diatur sebelum menjalankan seed.");
}

const pool = new Pool({ connectionString, max: 1 });
export const getDatabase = () => drizzle({ client: pool, schema });
export const closeDatabase = () => pool.end();