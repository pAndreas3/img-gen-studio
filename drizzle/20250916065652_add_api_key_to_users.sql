ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "balance" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "api_key" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_api_key_unique" UNIQUE("api_key");