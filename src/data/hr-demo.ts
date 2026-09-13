import type {
  AppState,
  BaseRecord,
  DataTable,
  FieldDefinition,
  OkrStore,
  SavedView,
  SelectOption,
  TaskCategory,
} from "@/domain/base";

const statusOptions: SelectOption[] = [
  { id: "not-started", label: "Not Started", color: "slate" },
  { id: "in-progress", label: "In Progress", color: "blue" },
  { id: "pending", label: "Pending", color: "amber" },
  { id: "blocked", label: "Blocked", color: "red" },
  { id: "done", label: "Done", color: "green" },
  { id: "cancelled", label: "Cancelled", color: "slate" },
];

const priorityOptions: SelectOption[] = [
  { id: "low", label: "Low", color: "slate" },
  { id: "medium", label: "Medium", color: "blue" },
  { id: "high", label: "High", color: "orange" },
  { id: "critical", label: "Critical", color: "red" },
];

const categoryOptions: SelectOption[] = [
  "HR Operations",
  "TA",
  "C&B",
  "L&D",
  "Employee Relations",
  "Payroll",
  "Social Insurance",
  "Training",
  "Contract",
  "Employee Evaluation",
  "HR Reporting",
  "Audit",
  "Policy",
  "Offboarding",
  "Onboarding",
].map((label, index) => ({
  id: `category-${index + 1}`,
  label,
  color: (["violet", "cyan", "blue", "green", "amber", "pink"] as const)[index % 6],
}));

const taskCategories: TaskCategory[] = categoryOptions.map((option, order) => ({
  id: option.id,
  name: option.label,
  color: ({ slate: "#64748b", blue: "#5b6ff2", cyan: "#3b94a3", green: "#2f8f72", amber: "#b87922", orange: "#c46632", red: "#c45151", violet: "#7461a8", pink: "#a95779" })[option.color],
  order,
}));

const taskFields: FieldDefinition[] = [
  { id: "taskName", name: "Task Name", type: "shortText", order: 0, width: 250, visible: true, frozen: true, required: true },
  { id: "category", name: "Category", type: "singleSelect", order: 1, width: 150, visible: true, frozen: false, configuration: { options: categoryOptions } },
  { id: "execution", name: "Execution Detail", type: "longText", order: 2, width: 260, visible: true, frozen: false },
  { id: "criteria", name: "Objective / Completion Criteria", type: "longText", order: 3, width: 260, visible: true, frozen: false },
  { id: "owner", name: "Owner", type: "person", order: 4, width: 150, visible: true, frozen: false },
  { id: "frequency", name: "Frequency", type: "singleSelect", order: 5, width: 120, visible: true, frozen: false, configuration: { options: [
    { id: "once", label: "Once", color: "slate" },
    { id: "weekly", label: "Weekly", color: "blue" },
    { id: "monthly", label: "Monthly", color: "violet" },
    { id: "quarterly", label: "Quarterly", color: "amber" },
  ] } },
  { id: "priority", name: "Priority", type: "singleSelect", order: 6, width: 110, visible: true, frozen: false, configuration: { options: priorityOptions } },
  { id: "status", name: "Status", type: "status", order: 7, width: 135, visible: true, frozen: false, configuration: { options: statusOptions } },
  { id: "startDate", name: "Start Date", type: "date", order: 8, width: 130, visible: true, frozen: false },
  { id: "dueDate", name: "Due Date", type: "date", order: 9, width: 130, visible: true, frozen: false },
  { id: "progress", name: "Progress", type: "progress", order: 10, width: 150, visible: true, frozen: false, configuration: { min: 0, max: 100 } },
  { id: "estimatedHours", name: "Est. Hours", type: "number", order: 11, width: 110, visible: true, frozen: false },
  { id: "actualHours", name: "Actual Hours", type: "number", order: 12, width: 110, visible: true, frozen: false },
  { id: "department", name: "Department", type: "singleSelect", order: 13, width: 140, visible: true, frozen: false, configuration: { options: [
    { id: "people", label: "People Ops", color: "violet" },
    { id: "finance", label: "Finance", color: "green" },
    { id: "all", label: "Company-wide", color: "blue" },
  ] } },
  { id: "objectiveId", name: "Objective", type: "relationship", order: 14, width: 220, visible: true, frozen: false, configuration: { description: "Objective this task contributes to." } },
  { id: "keyResultId", name: "Key Result", type: "relationship", order: 15, width: 230, visible: true, frozen: false, configuration: { description: "Preferred direct OKR link used for progress roll-up." } },
  { id: "okrContributionWeight", name: "OKR Contribution Weight", type: "percentage", order: 16, width: 180, visible: true, frozen: false, configuration: { min: 0, max: 100 } },
  { id: "importance", name: "Importance", type: "singleSelect", order: 17, width: 135, visible: true, frozen: false, configuration: { options: [{ id: "important", label: "Important", color: "red" }, { id: "not-important", label: "Not Important", color: "slate" }] } },
  { id: "urgency", name: "Urgency", type: "singleSelect", order: 18, width: 125, visible: true, frozen: false, configuration: { options: [{ id: "urgent", label: "Urgent", color: "orange" }, { id: "not-urgent", label: "Not Urgent", color: "blue" }] } },
  { id: "dependencies", name: "Dependencies", type: "relationship", order: 19, width: 190, visible: true, frozen: false, configuration: { relatedTableId: "table-tasks", description: "Tasks that must finish before this task can complete." } },
  { id: "createdBy", name: "Created By", type: "createdBy", order: 20, width: 140, visible: false, frozen: false },
  { id: "createdTime", name: "Created Time", type: "createdTime", order: 21, width: 150, visible: false, frozen: false },
  { id: "modifiedTime", name: "Modified Time", type: "modifiedTime", order: 22, width: 150, visible: false, frozen: false },
  { id: "taskId", name: "Task ID", type: "autoNumber", order: 23, width: 110, visible: false, frozen: false },
  { id: "subcategory", name: "Subcategory", type: "singleSelect", order: 24, width: 150, visible: false, frozen: false },
  { id: "collaborators", name: "Collaborators", type: "multiplePeople", order: 25, width: 180, visible: false, frozen: false },
  { id: "plannedEnd", name: "Planned End", type: "dateTime", order: 26, width: 170, visible: false, frozen: false },
  { id: "actualStart", name: "Actual Start", type: "dateTime", order: 27, width: 170, visible: false, frozen: false },
  { id: "actualEnd", name: "Actual End", type: "dateTime", order: 28, width: 170, visible: false, frozen: false },
  { id: "completedAt", name: "Completed At", type: "dateTime", order: 29, width: 170, visible: false, frozen: false },
  { id: "tags", name: "Tags", type: "multiSelect", order: 30, width: 180, visible: false, frozen: false },
  { id: "notes", name: "Notes", type: "longText", order: 31, width: 260, visible: false, frozen: false },
];

type TaskSeed = [string, string, string, string, string, string, string, string, string, string, number, number, number, string];

const taskSeeds: TaskSeed[] = [
  ["Complete September payroll validation", "Payroll", "Reconcile attendance, allowances and exceptions before payroll close.", "All variances reviewed and payroll file approved.", "Linh Nguyen", "Monthly", "Critical", "In Progress", "2026-09-01", "2026-09-15", 72, 12, 9, "Finance"],
  ["Renew expiring labor contracts", "Contract", "Review 18 contracts expiring within the next 45 days.", "Signed renewal or documented exit decision for every employee.", "Minh Tran", "Monthly", "High", "In Progress", "2026-09-03", "2026-09-18", 45, 18, 8, "People Ops"],
  ["Enroll new hires in social insurance", "Social Insurance", "Prepare declarations and validate government portal submissions.", "All August joiners have an accepted contribution record.", "An Pham", "Monthly", "High", "Pending", "2026-09-02", "2026-09-13", 80, 8, 7, "People Ops"],
  ["Q3 mandatory compliance training", "Training", "Coordinate final sessions and follow up with missing participants.", "100% completion and certificates archived.", "Bao Le", "Quarterly", "High", "In Progress", "2026-08-20", "2026-09-25", 64, 30, 19, "Company-wide"],
  ["Audit employee master data", "Audit", "Compare HRIS profiles with signed employee documents.", "Zero critical data mismatches in active employee records.", "Linh Nguyen", "Quarterly", "Medium", "In Progress", "2026-09-05", "2026-09-30", 31, 24, 7, "People Ops"],
  ["Publish remote work policy update", "Policy", "Incorporate legal feedback and publish the approved revision.", "Policy acknowledged by department managers.", "Thu Vo", "Once", "Medium", "Not Started", "2026-09-16", "2026-09-29", 10, 14, 1, "Company-wide"],
  ["Prepare August HR operations report", "HR Reporting", "Consolidate headcount, turnover and service-level metrics.", "Leadership pack reviewed and distributed.", "Minh Tran", "Monthly", "High", "Blocked", "2026-09-01", "2026-09-10", 55, 10, 11, "People Ops"],
  ["Finalize onboarding for design hires", "Onboarding", "Complete equipment, access and 30-day plans for three hires.", "All onboarding checklist items closed.", "An Pham", "Once", "Medium", "Done", "2026-08-25", "2026-09-08", 100, 15, 14, "People Ops"],
  ["Schedule probation evaluations", "Employee Evaluation", "Notify managers and book review meetings for September cases.", "Meetings scheduled and forms assigned.", "Bao Le", "Monthly", "Medium", "Pending", "2026-09-06", "2026-09-14", 60, 6, 4, "People Ops"],
  ["Offboard regional sales specialist", "Offboarding", "Coordinate final pay, asset return and access removal.", "Signed clearance with every access revoked on time.", "Thu Vo", "Once", "Critical", "In Progress", "2026-09-09", "2026-09-12", 85, 8, 8, "People Ops"],
  ["Archive 2025 employee files", "Employee Records", "Apply retention labels and move validated files to archive.", "Archive register reconciles to HRIS headcount.", "Linh Nguyen", "Once", "Low", "Not Started", "2026-10-01", "2026-10-23", 0, 36, 0, "People Ops"],
  ["Reconcile insurance contribution variance", "Social Insurance", "Investigate a difference between payroll and contribution ledgers.", "Variance resolved and correction accepted.", "Minh Tran", "Once", "Critical", "Blocked", "2026-09-04", "2026-09-11", 35, 12, 10, "Finance"],
  ["Manager essentials cohort 4", "Training", "Launch the fourth manager capability workshop cohort.", "Attendance above 90% and feedback score above 4.2.", "Bao Le", "Once", "Medium", "Not Started", "2026-10-05", "2026-10-20", 5, 24, 1, "Company-wide"],
  ["Clean duplicate employee profiles", "Employee Records", "Merge duplicate historical HRIS profiles after owner validation.", "No duplicate active identifiers remain.", "An Pham", "Once", "Low", "Done", "2026-08-12", "2026-08-31", 100, 10, 9, "People Ops"],
  ["Issue annual tax documents", "Payroll", "Generate, verify and distribute annual tax confirmation documents.", "All active and former employees receive validated documents.", "Thu Vo", "Once", "High", "Not Started", "2026-11-01", "2026-12-10", 0, 28, 0, "Finance"],
  ["Review HR vendor data access", "Audit", "Confirm least-privilege access and current DPAs for HR vendors.", "Every vendor has an owner, valid DPA and approved access scope.", "Linh Nguyen", "Quarterly", "High", "In Progress", "2026-09-01", "2026-09-22", 48, 20, 9, "People Ops"],
  ["Refresh new starter orientation deck", "Onboarding", "Update benefits, security and culture sections for Q4.", "Content owners approve a single published version.", "An Pham", "Quarterly", "Low", "Pending", "2026-09-14", "2026-10-02", 25, 8, 2, "Company-wide"],
  ["Close August payroll queries", "Payroll", "Resolve the remaining employee payroll tickets and document outcomes.", "Every ticket closed within the service-level target.", "Minh Tran", "Monthly", "Medium", "Done", "2026-09-01", "2026-09-07", 100, 7, 6, "Finance"],
];

const taskRecords: BaseRecord[] = taskSeeds.map((seed, index) => ({
  id: `task-${index + 1}`,
  values: {
    taskName: seed[0], category: seed[1], execution: seed[2], criteria: seed[3], owner: seed[4],
    frequency: seed[5], priority: seed[6], status: seed[7], startDate: seed[8], dueDate: seed[9],
    progress: seed[10], estimatedHours: seed[11], actualHours: seed[12], department: seed[13],
    objectiveId: index < 6 ? "objective-operations" : index >= 11 && index < 16 ? "objective-compliance" : null,
    keyResultId: index < 3 ? "kr-turnaround" : index < 6 ? "kr-automation" : index >= 11 && index < 16 ? "kr-compliance" : null,
    okrContributionWeight: index < 3 ? [40, 40, 20][index] : null,
    importance: ["High", "Critical"].includes(seed[6]) ? "Important" : "Not Important",
    urgency: !["Done", "Cancelled"].includes(seed[7]) && seed[9] <= "2026-09-16" ? "Urgent" : "Not Urgent",
    dependencies: index > 0 && index % 3 === 0 ? [`task-${index}`] : [],
    createdBy: "Hieu Nguyen", createdTime: "2026-08-20T09:00:00.000Z", modifiedTime: "2026-09-11T16:30:00.000Z",
  },
  createdAt: "2026-08-20T09:00:00.000Z",
  updatedAt: "2026-09-11T16:30:00.000Z",
  createdBy: "Hieu Nguyen",
  comments: index % 4,
  attachments: index % 3,
}));

const emptyFilters = (id: string) => ({ id, conjunction: "and" as const, conditions: [] });
const defaultHiddenFieldIds = ["dependencies", ...taskFields.filter((field) => !field.visible).map((field) => field.id)];

const taskViews: SavedView[] = [
  {
    id: "view-all-tasks", name: "All Tasks", kind: "grid", filters: emptyFilters("fg-all"), sorting: [],
    hiddenFieldIds: defaultHiddenFieldIds, columnOrder: taskFields.map((field) => field.id),
    frozenFieldCount: 1, rowHeight: "compact", conditionalFormatting: [
      { id: "cf-blocked", name: "Blocked tasks", enabled: true, target: "row", style: { background: "var(--format-red)" }, conditions: { id: "cfg-blocked", conjunction: "and", conditions: [{ id: "c-blocked", fieldId: "status", operator: "equals", value: "Blocked" }] } },
      { id: "cf-done", name: "Completed progress", enabled: true, target: "cell", targetFieldId: "progress", style: { foreground: "var(--success)" }, conditions: { id: "cfg-done", conjunction: "and", conditions: [{ id: "c-done", fieldId: "progress", operator: "gte", value: 100 }] } },
    ],
  },
  {
    id: "view-my-tasks", name: "My Tasks", kind: "grid", personal: true,
    filters: { id: "fg-mine", conjunction: "and", conditions: [{ id: "f-mine", fieldId: "owner", operator: "equals", value: "Linh Nguyen" }] },
    sorting: [{ id: "sort-mine", fieldId: "dueDate", direction: "asc" }], hiddenFieldIds: defaultHiddenFieldIds,
    columnOrder: taskFields.map((field) => field.id), frozenFieldCount: 1, rowHeight: "compact", conditionalFormatting: [],
  },
  {
    id: "view-overdue", name: "Overdue Tasks", kind: "grid",
    filters: { id: "fg-overdue", conjunction: "and", conditions: [
      { id: "f-overdue-date", fieldId: "dueDate", operator: "before", value: "2026-09-12" },
      { id: "f-overdue-status", fieldId: "status", operator: "notEquals", value: "Done" },
    ] }, sorting: [{ id: "sort-overdue", fieldId: "dueDate", direction: "asc" }],
    hiddenFieldIds: defaultHiddenFieldIds, columnOrder: taskFields.map((field) => field.id),
    frozenFieldCount: 1, rowHeight: "compact", conditionalFormatting: [],
  },
  {
    id: "view-completed", name: "Completed Tasks", kind: "grid",
    filters: { id: "fg-completed", conjunction: "and", conditions: [{ id: "f-completed", fieldId: "status", operator: "equals", value: "Done" }] },
    sorting: [{ id: "sort-completed", fieldId: "dueDate", direction: "desc" }], hiddenFieldIds: defaultHiddenFieldIds,
    columnOrder: taskFields.map((field) => field.id), frozenFieldCount: 1, rowHeight: "compact", conditionalFormatting: [],
  },
  ...[
    ["view-ta", "TA", "TA"],
    ["view-cb", "C&B", "C&B"],
    ["view-ld", "L&D", "L&D"],
    ["view-social-insurance", "Social Insurance", "Social Insurance"],
    ["view-employee-relations", "Employee Relations", "Employee Relations"],
  ].map(([id, name, category]) => ({
    id, name, kind: "grid" as const,
    filters: { id: `${id}-filters`, conjunction: "and" as const, conditions: [{ id: `${id}-category`, fieldId: "category", operator: "equals" as const, value: category }] },
    sorting: [], hiddenFieldIds: defaultHiddenFieldIds,
    columnOrder: taskFields.map((field) => field.id), frozenFieldCount: 1, rowHeight: "compact" as const, maxAutoHeight: 144, conditionalFormatting: [],
  })),
  { id: "view-kanban-status", name: "Kanban by Status", kind: "kanban", filters: emptyFilters("fg-kanban"), sorting: [], groupByFieldId: "status", hiddenFieldIds: [], columnOrder: [], frozenFieldCount: 0, rowHeight: "comfortable", conditionalFormatting: [] },
  { id: "view-calendar", name: "Calendar", kind: "calendar", filters: emptyFilters("fg-calendar"), sorting: [], hiddenFieldIds: [], columnOrder: [], frozenFieldCount: 0, rowHeight: "comfortable", conditionalFormatting: [] },
  { id: "view-gantt", name: "Gantt", kind: "gantt", filters: emptyFilters("fg-gantt"), sorting: [{ id: "sort-gantt", fieldId: "startDate", direction: "asc" }], hiddenFieldIds: [], columnOrder: [], frozenFieldCount: 0, rowHeight: "comfortable", conditionalFormatting: [] },
  { id: "view-timeline", name: "Timeline", kind: "timeline", filters: emptyFilters("fg-timeline"), sorting: [{ id: "sort-timeline", fieldId: "startDate", direction: "asc" }], hiddenFieldIds: [], columnOrder: [], frozenFieldCount: 0, rowHeight: "comfortable", conditionalFormatting: [] },
  { id: "view-list", name: "List", kind: "list", filters: emptyFilters("fg-list"), sorting: [{ id: "sort-list", fieldId: "dueDate", direction: "asc" }], hiddenFieldIds: [], columnOrder: [], frozenFieldCount: 0, rowHeight: "comfortable", conditionalFormatting: [] },
  { id: "view-gallery", name: "Gallery", kind: "gallery", filters: emptyFilters("fg-gallery"), sorting: [{ id: "sort-gallery", fieldId: "dueDate", direction: "asc" }], hiddenFieldIds: [], columnOrder: [], frozenFieldCount: 0, rowHeight: "comfortable", conditionalFormatting: [] },
  { id: "view-form", name: "Form", kind: "form", filters: emptyFilters("fg-form"), sorting: [], hiddenFieldIds: ["createdBy", "createdTime", "modifiedTime"], columnOrder: [], frozenFieldCount: 0, rowHeight: "comfortable", conditionalFormatting: [] },
  { id: "view-eisenhower", name: "Eisenhower", kind: "eisenhower", filters: emptyFilters("fg-eisenhower"), sorting: [{ id: "sort-eisenhower", fieldId: "dueDate", direction: "asc" }], hiddenFieldIds: ["dependencies", "createdBy", "createdTime", "modifiedTime"], columnOrder: taskFields.map((field) => field.id), frozenFieldCount: 0, rowHeight: "comfortable", conditionalFormatting: [] },
];

const okrs: OkrStore = {
  teams: [
    { id: "team-people", name: "People Operations", color: "violet" },
    { id: "team-finance", name: "Finance & Payroll", color: "green" },
    { id: "team-company", name: "Company-wide", color: "blue" },
  ],
  cycles: [
    { id: "cycle-q3-2026", name: "Q3 2026", type: "quarter", startDate: "2026-07-01", endDate: "2026-09-30" },
    { id: "cycle-q4-2026", name: "Q4 2026", type: "quarter", startDate: "2026-10-01", endDate: "2026-12-31" },
    { id: "cycle-2026", name: "2026", type: "year", startDate: "2026-01-01", endDate: "2026-12-31" },
  ],
  objectives: [
    { id: "objective-operations", title: "Improve HR Operational Excellence", description: "Make core HR services faster, predictable and easier to audit.", teamId: "team-people", owner: "Hieu Nguyen", contributors: ["Linh Nguyen", "Minh Tran"], cycleId: "cycle-q3-2026", startDate: "2026-07-01", endDate: "2026-09-30", status: "On Track", confidence: 82, priority: "Critical" },
    { id: "objective-capability", title: "Build manager capability at scale", description: "Equip every people manager with consistent operating practices.", teamId: "team-company", owner: "Bao Le", contributors: ["Hieu Nguyen", "An Pham"], cycleId: "cycle-q4-2026", startDate: "2026-10-01", endDate: "2026-12-31", status: "At Risk", confidence: 64, priority: "High" },
    { id: "objective-compliance", title: "Strengthen workforce compliance", description: "Reduce compliance exceptions and close audit findings on time.", teamId: "team-finance", owner: "Linh Nguyen", contributors: ["Hieu Nguyen", "Thu Vo"], cycleId: "cycle-q3-2026", startDate: "2026-07-01", endDate: "2026-09-30", status: "Off Track", confidence: 48, priority: "High" },
  ],
  keyResults: [
    { id: "kr-turnaround", objectiveId: "objective-operations", title: "Reduce HR processing turnaround time by 30%", owner: "Hieu Nguyen", type: "task", targetValue: 100, currentValue: 0, startValue: 0, unit: "%", weight: 60, status: "On Track" },
    { id: "kr-automation", objectiveId: "objective-operations", title: "Automate 6 high-volume HR workflows", owner: "Linh Nguyen", type: "numeric", targetValue: 6, currentValue: 4, startValue: 0, unit: "workflows", weight: 40, status: "On Track" },
    { id: "kr-manager", objectiveId: "objective-capability", title: "Reach 90% manager essentials completion", owner: "Bao Le", type: "percentage", targetValue: 90, currentValue: 64, startValue: 0, unit: "%", weight: 100, status: "At Risk" },
    { id: "kr-compliance", objectiveId: "objective-compliance", title: "Close priority compliance findings", owner: "Linh Nguyen", type: "task", targetValue: 100, currentValue: 0, startValue: 0, unit: "%", weight: 70, status: "Off Track" },
    { id: "kr-confidence", objectiveId: "objective-compliance", title: "Raise audit confidence to 85%", owner: "Thu Vo", type: "manual", targetValue: 85, currentValue: 0, startValue: 45, manualProgress: 55, unit: "%", weight: 30, status: "At Risk" },
  ],
  urgencyDueDays: null,
};

function simpleTable(
  id: string,
  name: string,
  icon: string,
  columns: Array<[string, string, FieldDefinition["type"], number]>,
  rows: Array<Record<string, string | number>>,
): DataTable {
  const fields: FieldDefinition[] = columns.map(([fieldId, fieldName, type, width], index) => ({
    id: fieldId, name: fieldName, type, width, order: index, visible: true, frozen: index === 0,
  }));
  return {
    id, name, icon, fields,
    records: rows.map((values, index) => ({
      id: `${id}-${index + 1}`, values, createdAt: "2026-09-01T08:00:00.000Z", updatedAt: "2026-09-10T08:00:00.000Z", createdBy: "Hieu Nguyen",
    })),
    views: [{
      id: `${id}-view`, name: `All ${name}`, kind: "grid", filters: emptyFilters(`${id}-filters`), sorting: [],
      hiddenFieldIds: [], columnOrder: fields.map((field) => field.id), frozenFieldCount: 1, rowHeight: "compact", conditionalFormatting: [],
    }],
  };
}

const tables: DataTable[] = [
  { id: "table-tasks", name: "All Tasks", icon: "check", description: "The shared task engine for HR operations.", fields: taskFields, records: taskRecords, views: taskViews },
  simpleTable("table-employees", "Employee", "users", [["employee", "Employee", "shortText", 220], ["employeeId", "Employee ID", "shortText", 120], ["department", "Department", "singleSelect", 150], ["manager", "Manager", "person", 170], ["startDate", "Start Date", "date", 140], ["status", "Employment Status", "status", 160]], [
    { employee: "Mai Anh Nguyen", employeeId: "E-1042", department: "Product", manager: "Thanh Le", startDate: "2023-05-15", status: "Active" },
    { employee: "Quang Minh Tran", employeeId: "E-1098", department: "Finance", manager: "Lan Pham", startDate: "2024-02-01", status: "Active" },
    { employee: "Gia Bao Le", employeeId: "E-1124", department: "Engineering", manager: "Thanh Le", startDate: "2024-08-19", status: "Active" },
    { employee: "Thu Ha Vo", employeeId: "E-1170", department: "People Ops", manager: "Linh Nguyen", startDate: "2025-01-06", status: "Active" },
    { employee: "Khanh An Pham", employeeId: "E-1213", department: "Sales", manager: "Nam Do", startDate: "2025-07-14", status: "Probation" },
  ]),
  simpleTable("table-insurance", "Social Insurance", "shield", [["employee", "Employee", "shortText", 220], ["insuranceNo", "Insurance No.", "shortText", 150], ["contribution", "Monthly Contribution", "currency", 190], ["submittedDate", "Submitted Date", "date", 150], ["status", "Filing Status", "status", 150]], [
    { employee: "Mai Anh Nguyen", insuranceNo: "SI-8821042", contribution: 4850000, submittedDate: "2026-09-05", status: "Accepted" },
    { employee: "Quang Minh Tran", insuranceNo: "SI-8821098", contribution: 5220000, submittedDate: "2026-09-05", status: "Accepted" },
    { employee: "Gia Bao Le", insuranceNo: "SI-8821124", contribution: 4980000, submittedDate: "2026-09-06", status: "Pending" },
  ]),
  simpleTable("table-training", "Training", "book", [["course", "Course", "shortText", 250], ["cohort", "Cohort", "shortText", 120], ["owner", "Owner", "person", 170], ["attendees", "Attendees", "integer", 120], ["completion", "Completion", "progress", 150], ["date", "Session Date", "date", 150]], [
    { course: "Information Security Essentials", cohort: "Q3-06", owner: "Bao Le", attendees: 84, completion: 92, date: "2026-09-19" },
    { course: "Manager Essentials", cohort: "Cohort 4", owner: "Thu Vo", attendees: 22, completion: 35, date: "2026-10-08" },
    { course: "Workplace Conduct", cohort: "Q3-02", owner: "An Pham", attendees: 91, completion: 100, date: "2026-08-28" },
  ]),
  simpleTable("table-audit", "Master Audit", "history", [["timestamp", "Timestamp", "dateTime", 190], ["user", "User", "person", 170], ["action", "Action", "shortText", 170], ["object", "Object", "shortText", 240], ["details", "Change Summary", "longText", 320]], [
    { timestamp: "2026-09-11T16:30:00.000Z", user: "Linh Nguyen", action: "Updated record", object: "Complete September payroll validation", details: "Progress changed from 64% to 72%" },
    { timestamp: "2026-09-11T10:10:00.000Z", user: "Minh Tran", action: "Created view", object: "Overdue Tasks", details: "Created a shared filtered grid view" },
    { timestamp: "2026-09-10T08:45:00.000Z", user: "An Pham", action: "Updated field", object: "Priority", details: "Added Critical selection option" },
  ]),
];

export const initialAppState: AppState = {
  workspaces: [{
    id: "workspace-bestarion",
    name: "BESTARION",
    slug: "bestarion",
    bases: [{ id: "base-hr-operations", name: "HR Operations", color: "violet", tables }],
  }],
  activeWorkspaceId: "workspace-bestarion",
  activeBaseId: "base-hr-operations",
  activeTableId: "table-tasks",
  activeViewId: "view-all-tasks",
  okrs,
  taskCategories,
  capturedThoughts: [
    { id: "thought-payroll", userId: "Hieu Nguyen", taskName: "Prepare payroll reconciliation", categoryId: taskCategories.find((category) => category.name === "C&B")?.id ?? taskCategories[0].id, estimatedDurationMinutes: 120, roughTiming: "Today", status: "CAPTURED", createdAt: "2026-09-13T08:10:00.000Z" },
    { id: "thought-cv", userId: "Hieu Nguyen", taskName: "Review CV shortlist", categoryId: taskCategories.find((category) => category.name === "TA")?.id ?? taskCategories[0].id, estimatedDurationMinutes: 30, roughTiming: "Tomorrow", status: "CAPTURED", createdAt: "2026-09-13T08:12:00.000Z" },
  ],
  dashboards: [{
    id: "dashboard-personal",
    name: "My Dashboard",
    owner: "Hieu Nguyen",
    scope: "personal",
    baseId: "base-hr-operations",
    defaultPageId: "dashboard-page-overview",
    pages: [
      { id: "dashboard-page-overview", name: "Executive Overview", order: 0, visuals: [
        { id: "visual-total", kind: "kpi", title: "Total tasks", aggregation: "count", x: 0, y: 0, w: 3, h: 2 },
        { id: "visual-status", kind: "donut", title: "Task status", fieldId: "status", aggregation: "count", x: 3, y: 0, w: 4, h: 4 },
        { id: "visual-category", kind: "bar", title: "Tasks by category", fieldId: "category", aggregation: "count", x: 7, y: 0, w: 5, h: 4 },
        { id: "visual-upcoming", kind: "taskList", title: "Upcoming deadlines", x: 0, y: 4, w: 12, h: 4 },
      ] },
      { id: "dashboard-page-workload", name: "Workload", order: 1, visuals: [
        { id: "visual-owner", kind: "bar", title: "Tasks by owner", fieldId: "owner", aggregation: "count", x: 0, y: 0, w: 7, h: 4 },
        { id: "visual-progress", kind: "kpi", title: "Average progress", fieldId: "progress", aggregation: "average", x: 7, y: 0, w: 5, h: 2 },
      ] },
    ],
  }],
  activeDashboardId: "dashboard-personal",
  activeDashboardPageId: "dashboard-page-overview",
};
