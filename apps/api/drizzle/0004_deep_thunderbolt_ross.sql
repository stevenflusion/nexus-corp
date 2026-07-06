ALTER TABLE "leads" ADD COLUMN "accepted_terms_lead" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "accepted_terms_at" timestamp;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "accepted_terms_ip" varchar(45);