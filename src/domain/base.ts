export type FieldType =
  | "shortText"
  | "longText"
  | "number"
  | "integer"
  | "percentage"
  | "currency"
  | "checkbox"
  | "date"
  | "dateTime"
  | "duration"
  | "singleSelect"
  | "multiSelect"
  | "status"
  | "rating"
  | "person"
  | "multiplePeople"
  | "team"
  | "email"
  | "phone"
  | "url"
  | "location"
  | "attachment"
  | "signature"
  | "formula"
  | "autoNumber"
  | "progress"
  | "linkToRecord"
  | "relationship"
  | "lookup"
  | "rollup"
  | "createdTime"
  | "createdBy"
  | "modifiedTime"
  | "modifiedBy"
  | "button";

export type CellValue = string | number | boolean | string[] | null;

export interface SelectOption {
  id: string;
  label: string;
  color: "slate" | "blue" | "cyan" | "green" | "amber" | "orange" | "red" | "violet" | "pink";
}

export interface FieldConfiguration {
  options?: SelectOption[];
  precision?: number;
  currency?: string;
  min?: number;
  max?: number;
  relatedTableId?: string;
  formula?: string;
  description?: string;
  optionValue?: "id" | "label";
}

export interface FieldDefinition {
  id: string;
  name: string;
  type: FieldType;
  order: number;
  width: number;
  visible: boolean;
  frozen: boolean;
  required?: boolean;
  defaultValue?: CellValue;
  configuration?: FieldConfiguration;
}

export interface BaseRecord {
  id: string;
  values: Record<string, CellValue>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  comments?: number;
  attachments?: number;
}

export type FilterOperator =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "empty"
  | "notEmpty"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "before"
  | "after"
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "containsAny"
  | "containsAll";

export interface FilterCondition {
  id: string;
  fieldId: string;
  operator: FilterOperator;
  value?: CellValue;
  secondValue?: CellValue;
}

export interface FilterGroup {
  id: string;
  conjunction: "and" | "or";
  conditions: Array<FilterCondition | FilterGroup>;
}

export interface SortRule {
  id: string;
  fieldId: string;
  direction: "asc" | "desc";
}

export interface ConditionalFormatStyle {
  background?: string;
  foreground?: string;
  badgeTone?: SelectOption["color"];
}

export interface ConditionalFormattingRule {
  id: string;
  name: string;
  conditions: FilterGroup;
  target: "row" | "cell" | "field";
  targetFieldId?: string;
  style: ConditionalFormatStyle;
  enabled: boolean;
}

export type ViewKind = "grid" | "kanban" | "calendar" | "gantt" | "timeline" | "list" | "gallery" | "form" | "eisenhower";

export interface SavedView {
  id: string;
  name: string;
  kind: ViewKind;
  personal?: boolean;
  filters: FilterGroup;
  sorting: SortRule[];
  groupByFieldId?: string;
  hiddenFieldIds: string[];
  columnOrder: string[];
  frozenFieldCount: number;
  rowHeight: "compact" | "default" | "comfortable" | "auto";
  maxAutoHeight?: number;
  conditionalFormatting: ConditionalFormattingRule[];
}

export interface DataTable {
  id: string;
  name: string;
  icon: string;
  description?: string;
  fields: FieldDefinition[];
  records: BaseRecord[];
  views: SavedView[];
}

export interface BaseDefinition {
  id: string;
  name: string;
  color: string;
  tables: DataTable[];
  archivedAt?: string;
}

export type RoughTiming = "Now" | "Today" | "Tomorrow" | "This Week" | "Next Week" | "Later" | "Someday";
export type CaptureStatus = "CAPTURED" | "CLARIFYING" | "CONVERTED" | "ARCHIVED";

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  order: number;
  archived?: boolean;
}

export interface CapturedThought {
  id: string;
  userId: string;
  taskName: string;
  categoryId: string;
  estimatedDurationMinutes: number;
  roughTiming: RoughTiming;
  plannedStart?: string;
  status: CaptureStatus;
  createdAt: string;
  convertedTaskId?: string;
  convertedAt?: string;
}

export type DashboardVisualKind = "kpi" | "bar" | "donut" | "taskList" | "goalProgress" | "text";

export interface DashboardVisual {
  id: string;
  kind: DashboardVisualKind;
  title: string;
  fieldId?: string;
  aggregation?: "count" | "sum" | "average";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardPage {
  id: string;
  name: string;
  order: number;
  visuals: DashboardVisual[];
}

export interface DashboardDefinition {
  id: string;
  name: string;
  owner: string;
  scope: "personal" | "shared" | "workspace";
  baseId: string;
  defaultPageId: string;
  pages: DashboardPage[];
}

export interface WorkspaceDefinition {
  id: string;
  name: string;
  slug: string;
  bases: BaseDefinition[];
}

export type OkrStatus = "On Track" | "At Risk" | "Off Track" | "Completed";
export type KeyResultType = "task" | "numeric" | "percentage" | "manual";

export interface TeamDefinition {
  id: string;
  name: string;
  color: SelectOption["color"];
}

export interface OkrCycle {
  id: string;
  name: string;
  type: "quarter" | "year" | "custom";
  startDate: string;
  endDate: string;
}

export interface ObjectiveDefinition {
  id: string;
  title: string;
  description: string;
  teamId: string;
  owner: string;
  contributors: string[];
  cycleId: string;
  startDate: string;
  endDate: string;
  status: OkrStatus;
  confidence: number;
  priority: "Low" | "Medium" | "High" | "Critical";
}

export interface KeyResultDefinition {
  id: string;
  objectiveId: string;
  title: string;
  owner: string;
  type: KeyResultType;
  targetValue: number;
  currentValue: number;
  startValue: number;
  unit: string;
  weight: number;
  manualProgress?: number;
  status: OkrStatus;
}

export interface OkrStore {
  teams: TeamDefinition[];
  cycles: OkrCycle[];
  objectives: ObjectiveDefinition[];
  keyResults: KeyResultDefinition[];
  urgencyDueDays: number | null;
}

export interface AppState {
  workspaces: WorkspaceDefinition[];
  activeWorkspaceId: string;
  activeBaseId: string;
  activeTableId: string;
  activeViewId: string;
  okrs: OkrStore;
  taskCategories: TaskCategory[];
  capturedThoughts: CapturedThought[];
  dashboards: DashboardDefinition[];
  activeDashboardId: string;
  activeDashboardPageId: string;
}

export const fieldTypeLabels: Record<FieldType, string> = {
  shortText: "Short text",
  longText: "Long text",
  number: "Number",
  integer: "Integer",
  percentage: "Percentage",
  currency: "Currency",
  checkbox: "Checkbox",
  date: "Date",
  dateTime: "Date & time",
  duration: "Duration",
  singleSelect: "Single select",
  multiSelect: "Multi select",
  status: "Status",
  rating: "Rating",
  person: "Person",
  multiplePeople: "Multiple people",
  team: "Team / group",
  email: "Email",
  phone: "Phone",
  url: "URL",
  location: "Location",
  attachment: "Attachment",
  signature: "Signature",
  formula: "Formula",
  autoNumber: "Auto number",
  progress: "Progress",
  linkToRecord: "Link to record",
  relationship: "Two-way relationship",
  lookup: "Lookup",
  rollup: "Rollup",
  createdTime: "Created time",
  createdBy: "Created by",
  modifiedTime: "Modified time",
  modifiedBy: "Modified by",
  button: "Button",
};

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyView(name: string): SavedView {
  return {
    id: createId("view"),
    name,
    kind: "grid",
    filters: { id: createId("group"), conjunction: "and", conditions: [] },
    sorting: [],
    hiddenFieldIds: [],
    columnOrder: [],
    frozenFieldCount: 1,
    rowHeight: "compact",
    maxAutoHeight: 144,
    conditionalFormatting: [],
  };
}
