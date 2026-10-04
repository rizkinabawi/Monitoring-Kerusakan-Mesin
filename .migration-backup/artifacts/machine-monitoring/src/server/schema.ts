import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const machineStatus = pgEnum("machine_status", [
  "active",
  "down",
  "inactive",
]);
export const breakdownStatus = pgEnum("breakdown_status", [
  "open",
  "completed",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 30 }).notNull().default("maintenance"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  machineCode: varchar("machine_code", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  line: varchar("line", { length: 50 }).notNull(),
  status: machineStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const breakdowns = pgTable(
  "breakdowns",
  {
    id: serial("id").primaryKey(),
    machineId: integer("machine_id")
      .notNull()
      .references(() => machines.id, { onDelete: "restrict" }),
    problem: varchar("problem", { length: 255 }).notNull(),
    cause: varchar("cause", { length: 255 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    downtimeMinutes: integer("downtime_minutes"),
    status: breakdownStatus("status").notNull().default("open"),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("breakdowns_one_open_per_machine")
      .on(table.machineId)
      .where(sql`${table.status} = 'open'`),
  ],
);

export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  breakdownId: integer("breakdown_id")
    .notNull()
    .references(() => breakdowns.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 255 }).notNull(),
  componentReplaced: varchar("component_replaced", { length: 150 }),
  notes: text("notes"),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const schema = { users, machines, breakdowns, maintenance };

export type User = typeof users.$inferSelect;
export type Machine = typeof machines.$inferSelect;
export type Breakdown = typeof breakdowns.$inferSelect;
export type Maintenance = typeof maintenance.$inferSelect;