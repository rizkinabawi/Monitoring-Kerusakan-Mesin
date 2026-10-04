import { db, pool } from "@workspace/db";

export const getDatabase = () => db;
export const closeDatabase = () => pool.end();