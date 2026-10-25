CREATE TABLE "achievements"."offers" (
	"offer_id" text PRIMARY KEY NOT NULL,
	"seller_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievements"."player_stats" ADD COLUMN "offers_published" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "achievements"."player_stats" ADD COLUMN "trades_completed" integer DEFAULT 0 NOT NULL;