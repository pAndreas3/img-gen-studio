-- First, convert existing decimal values to cents (integer)
-- Convert user balance from dollars to cents
UPDATE "user" SET "balance" = ROUND("balance" * 100) WHERE "balance" IS NOT NULL;--> statement-breakpoint

-- Convert payment amounts from dollars to cents  
UPDATE "payments" SET "amount" = ROUND("amount" * 100) WHERE "amount" IS NOT NULL;--> statement-breakpoint

-- Now change the column types to integer
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "balance" SET DATA TYPE integer;