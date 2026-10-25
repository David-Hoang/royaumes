CREATE TABLE "achievements"."games" (
	"game_id" text PRIMARY KEY NOT NULL,
	"difficulty" text DEFAULT 'easy' NOT NULL,
	"companions" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievements"."player_stats" ADD COLUMN "easy_companions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "achievements"."player_stats" ADD COLUMN "hard_companions" integer DEFAULT 0 NOT NULL;