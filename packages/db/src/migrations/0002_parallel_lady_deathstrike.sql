ALTER TYPE "public"."conversation_status" ADD VALUE 'merged';--> statement-breakpoint
ALTER TYPE "public"."conversation_event_type" ADD VALUE 'ticket_merged';--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "color" SET DEFAULT '#7C8187';--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "merged_into_id" text;--> statement-breakpoint
CREATE INDEX "conversation_merged_into_idx" ON "conversation" USING btree ("merged_into_id");