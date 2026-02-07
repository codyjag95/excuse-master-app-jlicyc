CREATE TABLE "excuse_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"excuse_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "excuse_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"excuse_id" uuid NOT NULL,
	"share_method" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"excuse_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "excuse_ratings" ADD CONSTRAINT "excuse_ratings_excuse_id_excuses_id_fk" FOREIGN KEY ("excuse_id") REFERENCES "public"."excuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "excuse_shares" ADD CONSTRAINT "excuse_shares_excuse_id_excuses_id_fk" FOREIGN KEY ("excuse_id") REFERENCES "public"."excuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_excuse_id_excuses_id_fk" FOREIGN KEY ("excuse_id") REFERENCES "public"."excuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_excuse_id_device_id_unique" ON "favorites" USING btree ("excuse_id","device_id");