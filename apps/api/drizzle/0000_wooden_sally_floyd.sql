CREATE TYPE "public"."contact_preference_quotes" AS ENUM('phone', 'email', 'whatsapp', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_quotes" AS ENUM('vehicle', 'housing', 'consumer');--> statement-breakpoint
CREATE TYPE "public"."source_leads" AS ENUM('web', 'manual', 'quote', 'chatbot', 'otro');--> statement-breakpoint
CREATE TYPE "public"."status_leads" AS ENUM('new', 'contacted', 'qualified', 'lost');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id_admin_users" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_users_id_admin_users_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name_admin_users" varchar(100) NOT NULL,
	"email_admin_users" varchar(150) NOT NULL,
	"password_admin_users" varchar(150) NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_email_admin_users_unique" UNIQUE("email_admin_users")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id_audit_logs" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_audit_logs_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"action_audit_logs" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"id_admin_users" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id_lead_notes" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lead_notes_id_lead_notes_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"manager_lead_notes" varchar(100) NOT NULL,
	"note_lead_notes" text NOT NULL,
	"id_leads" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id_leads" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leads_id_leads_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name_leads" varchar(100) NOT NULL,
	"email_leads" varchar(100) NOT NULL,
	"phone_leads" varchar(100) NOT NULL,
	"city_leads" varchar(100) NOT NULL,
	"status_leads" "status_leads" DEFAULT 'new',
	"source_leads" "source_leads" DEFAULT 'web',
	"monthly_family_income" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id_quotes" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "quotes_id_quotes_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lead_id" integer NOT NULL,
	"product_quotes" "product_quotes" NOT NULL,
	"requested_amount_quotes" numeric(10, 2) NOT NULL,
	"down_payment_quotes" numeric(10, 2) NOT NULL,
	"term_months_quotes" integer NOT NULL,
	"annual_interest_rate_quotes" numeric(5, 2) NOT NULL,
	"monthly_payment_quotes" numeric(10, 2) NOT NULL,
	"contact_preference_quotes" "contact_preference_quotes" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_id_admin_users_admin_users_id_admin_users_fk" FOREIGN KEY ("id_admin_users") REFERENCES "public"."admin_users"("id_admin_users") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_id_leads_leads_id_leads_fk" FOREIGN KEY ("id_leads") REFERENCES "public"."leads"("id_leads") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_lead_id_leads_id_leads_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id_leads") ON DELETE cascade ON UPDATE no action;