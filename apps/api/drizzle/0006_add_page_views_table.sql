CREATE TABLE "page_views" (
	"id_page_views" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_views_id_page_views_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"page_path" varchar(500) NOT NULL,
	"referrer" varchar(500),
	"user_agent" text,
	"ip_address" varchar(45),
	"session_id" varchar(64),
	"device_type" varchar(20),
	"country" varchar(100),
	"city" varchar(100),
	"created_at" timestamp DEFAULT now()
);
