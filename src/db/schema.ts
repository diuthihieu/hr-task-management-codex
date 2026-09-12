import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const memberRole = pgEnum("member_role", ["owner", "admin", "editor", "contributor", "viewer"]);
export const viewKind = pgEnum("view_kind", ["grid", "kanban", "calendar", "gantt", "gallery", "form"]);
export const workflowStatus = pgEnum("workflow_status", ["draft", "active", "paused", "archived"]);
export const executionStatus = pgEnum("execution_status", ["queued", "running", "succeeded", "failed", "retrying"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  ...timestamps,
}, (table) => [uniqueIndex("users_email_idx").on(table.email)]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
}, (table) => [uniqueIndex("workspaces_slug_idx").on(table.slug)]);

export const workspaceMembers = pgTable("workspace_members", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: memberRole("role").notNull().default("viewer"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.workspaceId, table.userId] }), index("workspace_members_user_idx").on(table.userId)]);

export const bases = pgTable("bases", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("violet"),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
}, (table) => [index("bases_workspace_idx").on(table.workspaceId)]);

export const dataTables = pgTable("data_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  baseId: uuid("base_id").notNull().references(() => bases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("table"),
  description: text("description"),
  position: integer("position").notNull().default(0),
  ...timestamps,
}, (table) => [index("data_tables_base_idx").on(table.baseId)]);

export const fields = pgTable("fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableId: uuid("table_id").notNull().references(() => dataTables.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull().default({}),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  frozen: boolean("frozen").notNull().default(false),
  width: integer("width").notNull().default(180),
  defaultValue: jsonb("default_value"),
  validationRules: jsonb("validation_rules").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
}, (table) => [index("fields_table_position_idx").on(table.tableId, table.position)]);

/**
 * `data` is the row-read model. Typed values below are the indexed projection used
 * for filters, sorts, joins and aggregates. Writes update both in one transaction.
 */
export const dataRecords = pgTable("data_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableId: uuid("table_id").notNull().references(() => dataTables.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  position: bigint("position", { mode: "number" }).notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id),
  modifiedBy: uuid("modified_by").references(() => users.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("records_table_position_idx").on(table.tableId, table.position),
  index("records_data_gin_idx").using("gin", table.data),
]);

export const recordValues = pgTable("record_values", {
  recordId: uuid("record_id").notNull().references(() => dataRecords.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id").notNull().references(() => fields.id, { onDelete: "cascade" }),
  textValue: text("text_value"),
  numberValue: numeric("number_value"),
  booleanValue: boolean("boolean_value"),
  dateValue: timestamp("date_value", { withTimezone: true }),
  jsonValue: jsonb("json_value"),
  searchValue: text("search_value"),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.recordId, table.fieldId] }),
  index("record_values_text_idx").on(table.fieldId, table.textValue),
  index("record_values_number_idx").on(table.fieldId, table.numberValue),
  index("record_values_date_idx").on(table.fieldId, table.dateValue),
  index("record_values_search_idx").on(table.fieldId, table.searchValue),
]);

export const savedViews = pgTable("saved_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableId: uuid("table_id").notNull().references(() => dataTables.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: viewKind("kind").notNull().default("grid"),
  ownerId: uuid("owner_id").references(() => users.id),
  isPersonal: boolean("is_personal").notNull().default(false),
  configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull().default({}),
  position: integer("position").notNull().default(0),
  ...timestamps,
}, (table) => [index("saved_views_table_idx").on(table.tableId, table.position)]);

export const dashboards = pgTable("dashboards", {
  id: uuid("id").primaryKey().defaultRandom(),
  baseId: uuid("base_id").notNull().references(() => bases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
});

export const dashboardBlocks = pgTable("dashboard_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  dashboardId: uuid("dashboard_id").notNull().references(() => dashboards.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  dataSource: jsonb("data_source").$type<Record<string, unknown>>().notNull(),
  configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull().default({}),
  layout: jsonb("layout").$type<{ x: number; y: number; w: number; h: number }>().notNull(),
  ...timestamps,
});

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  baseId: uuid("base_id").notNull().references(() => bases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: workflowStatus("status").notNull().default("draft"),
  version: integer("version").notNull().default(1),
  ...timestamps,
});

export const workflowNodes = pgTable("workflow_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull().default({}),
  position: jsonb("position").$type<{ x: number; y: number }>().notNull(),
  nextNodeIds: jsonb("next_node_ids").$type<string[]>().notNull().default([]),
  ...timestamps,
});

export const workflowExecutions = pgTable("workflow_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  recordId: uuid("record_id").references(() => dataRecords.id, { onDelete: "set null" }),
  status: executionStatus("status").notNull().default("queued"),
  attempt: integer("attempt").notNull().default(1),
  input: jsonb("input").$type<Record<string, unknown>>().notNull().default({}),
  output: jsonb("output").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordId: uuid("record_id").notNull().references(() => dataRecords.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  parentId: uuid("parent_id"),
  ...timestamps,
}, (table) => [index("comments_record_idx").on(table.recordId, table.createdAt)]);

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordId: uuid("record_id").references(() => dataRecords.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id").references(() => fields.id, { onDelete: "set null" }),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  storageKey: text("storage_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("attachments_record_idx").on(table.recordId)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  objectType: text("object_type").notNull(),
  objectId: text("object_id").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("audit_workspace_created_idx").on(table.workspaceId, table.createdAt), index("audit_object_idx").on(table.objectType, table.objectId)]);
