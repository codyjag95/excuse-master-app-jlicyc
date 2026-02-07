CREATE TABLE "excuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"situation" text NOT NULL,
	"tone" text NOT NULL,
	"length" text NOT NULL,
	"excuse" text NOT NULL,
	"believability_rating" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
