CREATE TYPE "public"."status_credit_scores" AS ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "credit_scores" (
	"id_credit_scores" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "credit_scores_id_credit_scores_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"storage_path_contract" varchar(255) NOT NULL,
	"storage_path_selfie" varchar(255) NOT NULL,
	"result_credit_scores" integer,
	"id_leads" integer NOT NULL,
	"status_credit_scores" "status_credit_scores" DEFAULT 'PENDING',
	"observations_credit_scores" varchar(500),
	"reviewed_by_magic_link" varchar(36),
	"create_at" timestamp DEFAULT now() NOT NULL,
	"update_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_scores" ADD CONSTRAINT "credit_scores_id_leads_leads_id_leads_fk" FOREIGN KEY ("id_leads") REFERENCES "public"."leads"("id_leads") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_scores" ADD CONSTRAINT "credit_scores_reviewed_by_magic_link_magic_links_id_fk" FOREIGN KEY ("reviewed_by_magic_link") REFERENCES "public"."magic_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_phone_leads_unique" UNIQUE("phone_leads");--> statement-breakpoint
ALTER TABLE "public"."magic_links" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."magic_link_role";--> statement-breakpoint
CREATE TYPE "public"."magic_link_role" AS ENUM('admin', 'sistemas', 'gerente_general', 'gerencia_marketing');--> statement-breakpoint
ALTER TABLE "public"."magic_links" ALTER COLUMN "role" SET DATA TYPE "public"."magic_link_role" USING "role"::"public"."magic_link_role";