CREATE TABLE "business_hours" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"schedule" jsonb NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "business_hours_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "sla_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"priority" "conversation_priority" NOT NULL,
	"first_response_minutes" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "sla_policy_org_priority_uniq" UNIQUE("organization_id","priority")
);
--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "first_response_at" timestamp;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "sla_first_response_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "sla_breached_at" timestamp;--> statement-breakpoint
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_policy" ADD CONSTRAINT "sla_policy_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_hours_org_idx" ON "business_hours" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sla_policy_org_idx" ON "sla_policy" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "conversation_sla_due_idx" ON "conversation" USING btree ("sla_first_response_due_at");