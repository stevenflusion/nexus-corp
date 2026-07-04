CREATE TYPE "public"."delivery_channel" AS ENUM('generate_only', 'send_email', 'generate_qr');--> statement-breakpoint
CREATE TYPE "public"."expiration_type" AS ENUM('relative', 'absolute');--> statement-breakpoint
CREATE TYPE "public"."magic_link_role" AS ENUM('admin', 'brand_manager', 'developer', 'external');--> statement-breakpoint
CREATE TYPE "public"."magic_link_status" AS ENUM('active', 'expired', 'used', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."usage_limit_type" AS ENUM('single', 'unlimited', 'specific');--> statement-breakpoint
CREATE TYPE "public"."activity_result" AS ENUM('success', 'failed_expired', 'failed_used', 'failed_revoked');--> statement-breakpoint
CREATE TABLE "magic_links" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"status" "magic_link_status" DEFAULT 'active' NOT NULL,
	"recipient_name" varchar(100) NOT NULL,
	"recipient_email" varchar(150),
	"recipient_phone" varchar(50),
	"internal_note" text,
	"role" "magic_link_role" NOT NULL,
	"scope" varchar(100) NOT NULL,
	"scope_id" varchar(100) NOT NULL,
	"destination_screen" varchar(100) NOT NULL,
	"expiration_type" "expiration_type" DEFAULT 'relative' NOT NULL,
	"expiration_date" timestamp,
	"deferred_activation" timestamp,
	"usage_limit_type" "usage_limit_type" DEFAULT 'unlimited' NOT NULL,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"delivery_channel" "delivery_channel" DEFAULT 'generate_only' NOT NULL,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_link_activity" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"magic_link_id" varchar(36) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"result" "activity_result" NOT NULL,
	"ip" varchar(45) NOT NULL,
	"device" varchar(200) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "magic_link_activity" ADD CONSTRAINT "magic_link_activity_magic_link_id_magic_links_id_fk" FOREIGN KEY ("magic_link_id") REFERENCES "public"."magic_links"("id") ON DELETE no action ON UPDATE no action;