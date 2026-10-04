CREATE TYPE "public"."breakdown_status" AS ENUM('open', 'completed');--> statement-breakpoint
CREATE TYPE "public"."machine_status" AS ENUM('active', 'down', 'inactive');--> statement-breakpoint
CREATE TABLE "breakdowns" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" integer NOT NULL,
	"problem" varchar(255) NOT NULL,
	"cause" varchar(255) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"downtime_minutes" integer,
	"status" "breakdown_status" DEFAULT 'open' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"line" varchar(50) NOT NULL,
	"status" "machine_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "machines_machine_code_unique" UNIQUE("machine_code")
);
--> statement-breakpoint
CREATE TABLE "maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"breakdown_id" integer NOT NULL,
	"action" varchar(255) NOT NULL,
	"component_replaced" varchar(150),
	"notes" text,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(30) DEFAULT 'maintenance' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "breakdowns" ADD CONSTRAINT "breakdowns_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakdowns" ADD CONSTRAINT "breakdowns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_breakdown_id_breakdowns_id_fk" FOREIGN KEY ("breakdown_id") REFERENCES "public"."breakdowns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "breakdowns_one_open_per_machine" ON "breakdowns" USING btree ("machine_id") WHERE "breakdowns"."status" = 'open';