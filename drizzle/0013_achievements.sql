CREATE SCHEMA "achievements";
--> statement-breakpoint
CREATE TABLE "achievements"."game_players" (
	"game_id" text NOT NULL,
	"player_id" text NOT NULL,
	CONSTRAINT "game_players_game_id_player_id_pk" PRIMARY KEY("game_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "achievements"."player_stats" (
	"player_id" text PRIMARY KEY NOT NULL,
	"games_played" integer DEFAULT 0 NOT NULL,
	"games_won" integer DEFAULT 0 NOT NULL,
	"upgrades" integer DEFAULT 0 NOT NULL,
	"gold" integer DEFAULT 0 NOT NULL
);
