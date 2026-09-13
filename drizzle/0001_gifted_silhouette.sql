CREATE TYPE "public"."capture_status" AS ENUM('captured', 'clarifying', 'converted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."dashboard_scope" AS ENUM('personal', 'shared', 'workspace');--> statement-breakpoint
CREATE TYPE "public"."key_result_type" AS ENUM('task', 'numeric', 'percentage', 'manual');--> statement-breakpoint
CREATE TYPE "public"."okr_status" AS ENUM('on_track', 'at_risk', 'off_track', 'completed');--> statement-breakpoint
CREATE TYPE "public"."task_importance" AS ENUM('important', 'not_important');--> statement-breakpoint
CREATE TYPE "public"."task_relationship_type" AS ENUM('parent', 'depends_on', 'blocks', 'related_to', 'duplicate_of');--> statement-breakpoint
CREATE TYPE "public"."task_urgency" AS ENUM('urgent', 'not_urgent');--> statement-breakpoint
ALTER TYPE "public"."view_kind" ADD VALUE 'timeline' BEFORE 'gallery';--> statement-breakpoint
ALTER TYPE "public"."view_kind" ADD VALUE 'list' BEFORE 'gallery';--> statement-breakpoint
ALTER TYPE "public"."view_kind" ADD VALUE 'eisenhower';--> statement-breakpoint
CREATE TABLE "captured_thoughts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"task_name" text NOT NULL,
	"category_id" uuid,
	"estimated_duration_minutes" integer NOT NULL,
	"rough_timing" text DEFAULT 'Today' NOT NULL,
	"planned_start" timestamp with time zone,
	"status" "capture_status" DEFAULT 'captured' NOT NULL,
	"converted_task_id" uuid,
	"converted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"page_id" uuid,
	"block_id" uuid,
	"scope" text NOT NULL,
	"field_id" uuid,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"objective_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" "key_result_type" NOT NULL,
	"target_value" numeric(16, 4) DEFAULT '100' NOT NULL,
	"current_value" numeric(16, 4) DEFAULT '0' NOT NULL,
	"start_value" numeric(16, 4) DEFAULT '0' NOT NULL,
	"manual_progress" numeric(5, 2),
	"unit" text DEFAULT '%' NOT NULL,
	"weight" numeric(5, 2) DEFAULT '100' NOT NULL,
	"status" "okr_status" DEFAULT 'on_track' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "objective_contributors" (
	"objective_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "objective_contributors_objective_id_user_id_pk" PRIMARY KEY("objective_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" "okr_status" DEFAULT 'on_track' NOT NULL,
	"confidence" numeric(5, 2) DEFAULT '0' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "okr_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'slate' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_okr_links" (
	"record_id" uuid PRIMARY KEY NOT NULL,
	"objective_id" uuid,
	"key_result_id" uuid,
	"contribution_weight" numeric(5, 2),
	"importance" "task_importance" DEFAULT 'not_important' NOT NULL,
	"urgency" "task_urgency" DEFAULT 'not_urgent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_relationships" (
	"source_task_id" uuid NOT NULL,
	"target_task_id" uuid NOT NULL,
	"type" "task_relationship_type" NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_relationships_source_task_id_target_task_id_type_pk" PRIMARY KEY("source_task_id","target_task_id","type")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'violet' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bases" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dashboard_blocks" ADD COLUMN "page_id" uuid;--> statement-breakpoint
ALTER TABLE "dashboards" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "dashboards" ADD COLUMN "scope" "dashboard_scope" DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboards" ADD COLUMN "default_page_id" uuid;--> statement-breakpoint
ALTER TABLE "saved_views" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "captured_thoughts" ADD CONSTRAINT "captured_thoughts_base_id_bases_id_fk" FOREIGN KEY ("base_id") REFERENCES "public"."bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captured_thoughts" ADD CONSTRAINT "captured_thoughts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captured_thoughts" ADD CONSTRAINT "captured_thoughts_category_id_task_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."task_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captured_thoughts" ADD CONSTRAINT "captured_thoughts_converted_task_id_data_records_id_fk" FOREIGN KEY ("converted_task_id") REFERENCES "public"."data_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_filters" ADD CONSTRAINT "dashboard_filters_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_filters" ADD CONSTRAINT "dashboard_filters_page_id_dashboard_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."dashboard_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_filters" ADD CONSTRAINT "dashboard_filters_block_id_dashboard_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."dashboard_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_filters" ADD CONSTRAINT "dashboard_filters_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_pages" ADD CONSTRAINT "dashboard_pages_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_objective_id_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."objectives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objective_contributors" ADD CONSTRAINT "objective_contributors_objective_id_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."objectives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objective_contributors" ADD CONSTRAINT "objective_contributors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_cycle_id_okr_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."okr_cycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "okr_cycles" ADD CONSTRAINT "okr_cycles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_categories" ADD CONSTRAINT "task_categories_base_id_bases_id_fk" FOREIGN KEY ("base_id") REFERENCES "public"."bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_okr_links" ADD CONSTRAINT "task_okr_links_record_id_data_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."data_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_okr_links" ADD CONSTRAINT "task_okr_links_objective_id_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."objectives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_okr_links" ADD CONSTRAINT "task_okr_links_key_result_id_key_results_id_fk" FOREIGN KEY ("key_result_id") REFERENCES "public"."key_results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_relationships" ADD CONSTRAINT "task_relationships_source_task_id_data_records_id_fk" FOREIGN KEY ("source_task_id") REFERENCES "public"."data_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_relationships" ADD CONSTRAINT "task_relationships_target_task_id_data_records_id_fk" FOREIGN KEY ("target_task_id") REFERENCES "public"."data_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_relationships" ADD CONSTRAINT "task_relationships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "captured_thoughts_user_status_idx" ON "captured_thoughts" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "captured_thoughts_base_idx" ON "captured_thoughts" USING btree ("base_id");--> statement-breakpoint
CREATE INDEX "dashboard_pages_dashboard_position_idx" ON "dashboard_pages" USING btree ("dashboard_id","position");--> statement-breakpoint
CREATE INDEX "key_results_objective_idx" ON "key_results" USING btree ("objective_id");--> statement-breakpoint
CREATE INDEX "key_results_owner_idx" ON "key_results" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "objective_contributors_user_idx" ON "objective_contributors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "objectives_workspace_cycle_idx" ON "objectives" USING btree ("workspace_id","cycle_id");--> statement-breakpoint
CREATE INDEX "objectives_team_owner_idx" ON "objectives" USING btree ("team_id","owner_id");--> statement-breakpoint
CREATE INDEX "okr_cycles_workspace_dates_idx" ON "okr_cycles" USING btree ("workspace_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "task_categories_base_position_idx" ON "task_categories" USING btree ("base_id","position");--> statement-breakpoint
CREATE INDEX "task_okr_links_objective_idx" ON "task_okr_links" USING btree ("objective_id");--> statement-breakpoint
CREATE INDEX "task_okr_links_key_result_idx" ON "task_okr_links" USING btree ("key_result_id");--> statement-breakpoint
CREATE INDEX "task_relationship_target_idx" ON "task_relationships" USING btree ("target_task_id");--> statement-breakpoint
CREATE INDEX "teams_workspace_idx" ON "teams" USING btree ("workspace_id");--> statement-breakpoint
ALTER TABLE "dashboard_blocks" ADD CONSTRAINT "dashboard_blocks_page_id_dashboard_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."dashboard_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;