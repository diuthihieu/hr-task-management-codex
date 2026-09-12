import type {
  BaseRecord,
  CellValue,
  ConditionalFormattingRule,
  FieldDefinition,
  FilterCondition,
  FilterGroup,
  SortRule,
} from "@/domain/base";

function normalize(value: CellValue | undefined) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.trim().toLocaleLowerCase();
  return value;
}

function asComparable(value: CellValue | undefined, field?: FieldDefinition): number | string {
  if (value == null) return "";
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (Array.isArray(value)) return value.join(", ").toLocaleLowerCase();
  if (field?.type === "date" || field?.type === "dateTime") {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? value.toLocaleLowerCase() : time;
  }
  return value.toLocaleLowerCase();
}

function isEmpty(value: CellValue | undefined) {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

export function matchesCondition(
  record: BaseRecord,
  condition: FilterCondition,
  fields: FieldDefinition[],
  now = new Date(),
) {
  const raw = record.values[condition.fieldId];
  const value = normalize(raw);
  const expected = normalize(condition.value);
  const field = fields.find((item) => item.id === condition.fieldId);
  const comparable = asComparable(raw, field);
  const compareTo = asComparable(condition.value, field);

  switch (condition.operator) {
    case "contains":
      return String(value ?? "").includes(String(expected ?? ""));
    case "notContains":
      return !String(value ?? "").includes(String(expected ?? ""));
    case "equals":
      return Array.isArray(value) ? value.includes(String(expected)) : value === expected;
    case "notEquals":
      return Array.isArray(value) ? !value.includes(String(expected)) : value !== expected;
    case "empty":
      return isEmpty(raw);
    case "notEmpty":
      return !isEmpty(raw);
    case "gt":
      return comparable > compareTo;
    case "gte":
      return comparable >= compareTo;
    case "lt":
      return comparable < compareTo;
    case "lte":
      return comparable <= compareTo;
    case "between": {
      const upper = asComparable(condition.secondValue, field);
      return comparable >= compareTo && comparable <= upper;
    }
    case "before":
      return new Date(String(raw)).getTime() < new Date(String(condition.value)).getTime();
    case "after":
      return new Date(String(raw)).getTime() > new Date(String(condition.value)).getTime();
    case "today":
      return String(raw).slice(0, 10) === now.toISOString().slice(0, 10);
    case "thisWeek": {
      const date = new Date(String(raw));
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return date >= start && date < end;
    }
    case "thisMonth": {
      const date = new Date(String(raw));
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    case "containsAny": {
      const source = Array.isArray(value) ? value : [String(value ?? "")];
      const targets = Array.isArray(expected) ? expected : [String(expected ?? "")];
      return targets.some((target) => source.includes(target));
    }
    case "containsAll": {
      const source = Array.isArray(value) ? value : [String(value ?? "")];
      const targets = Array.isArray(expected) ? expected : [String(expected ?? "")];
      return targets.every((target) => source.includes(target));
    }
  }
}

export function matchesFilterGroup(
  record: BaseRecord,
  group: FilterGroup,
  fields: FieldDefinition[],
  now?: Date,
): boolean {
  if (group.conditions.length === 0) return true;
  const matches = group.conditions.map((item) =>
    "conditions" in item
      ? matchesFilterGroup(record, item, fields, now)
      : matchesCondition(record, item, fields, now),
  );
  return group.conjunction === "and" ? matches.every(Boolean) : matches.some(Boolean);
}

export function sortRecords(records: BaseRecord[], rules: SortRule[], fields: FieldDefinition[]) {
  if (rules.length === 0) return records;
  return [...records].sort((left, right) => {
    for (const rule of rules) {
      const field = fields.find((item) => item.id === rule.fieldId);
      const a = asComparable(left.values[rule.fieldId], field);
      const b = asComparable(right.values[rule.fieldId], field);
      if (a === b) continue;
      const comparison = a > b ? 1 : -1;
      return rule.direction === "asc" ? comparison : -comparison;
    }
    return 0;
  });
}

export function queryRecords(
  records: BaseRecord[],
  fields: FieldDefinition[],
  filters: FilterGroup,
  sorting: SortRule[],
  search = "",
) {
  const needle = search.trim().toLocaleLowerCase();
  const filtered = records.filter((record) => {
    if (!matchesFilterGroup(record, filters, fields)) return false;
    if (!needle) return true;
    return Object.values(record.values).some((value) =>
      (Array.isArray(value) ? value.join(" ") : String(value ?? ""))
        .toLocaleLowerCase()
        .includes(needle),
    );
  });
  return sortRecords(filtered, sorting, fields);
}

export function getRecordFormatting(
  record: BaseRecord,
  rules: ConditionalFormattingRule[],
  fields: FieldDefinition[],
) {
  return rules.filter(
    (rule) => rule.enabled && matchesFilterGroup(record, rule.conditions, fields),
  );
}

export function groupRecords(records: BaseRecord[], fieldId?: string) {
  if (!fieldId) return [{ key: "all", label: "All records", records }];
  const groups = new Map<string, BaseRecord[]>();
  records.forEach((record) => {
    const raw = record.values[fieldId];
    const values = Array.isArray(raw) ? raw : [raw ?? "Unassigned"];
    values.forEach((value) => {
      const key = String(value || "Unassigned");
      groups.set(key, [...(groups.get(key) ?? []), record]);
    });
  });
  return [...groups.entries()].map(([key, groupedRecords]) => ({
    key,
    label: key,
    records: groupedRecords,
  }));
}
