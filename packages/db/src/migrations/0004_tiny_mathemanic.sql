CREATE TABLE "automation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger" text DEFAULT 'ticket_created' NOT NULL,
	"conditions_tree" jsonb NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "automation" ADD CONSTRAINT "automation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_org_idx" ON "automation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "automation_org_active_idx" ON "automation" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "contact_deleted_at_idx" ON "contact" USING btree ("deleted_at");