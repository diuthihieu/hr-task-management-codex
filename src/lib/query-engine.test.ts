import { describe, expect, it } from "vitest";
import type { BaseRecord, FieldDefinition, FilterGroup } from "@/domain/base";
import { getRecordFormatting, groupRecords, matchesFilterGroup, queryRecords } from "./query-engine";

const fields: FieldDefinition[] = [
  { id: "name", name: "Name", type: "shortText", order: 0, width: 200, visible: true, frozen: true },
  { id: "status", name: "Status", type: "status", order: 1, width: 140, visible: true, frozen: false },
  { id: "owner", name: "Owner", type: "person", order: 2, width: 140, visible: true, frozen: false },
  { id: "progress", name: "Progress", type: "progress", order: 3, width: 140, visible: true, frozen: false },
  { id: "due", name: "Due", type: "date", order: 4, width: 140, visible: true, frozen: false },
];

const records: BaseRecord[] = [
  { id: "1", values: { name: "Payroll close", status: "In Progress", owner: "Linh", progress: 75, due: "2026-09-10" }, createdAt: "", updatedAt: "", createdBy: "Hieu" },
  { id: "2", values: { name: "Training audit", status: "Done", owner: "Bao", progress: 100, due: "2026-09-15" }, createdAt: "", updatedAt: "", createdBy: "Hieu" },
  { id: "3", values: { name: "Insurance filing", status: "Blocked", owner: "Linh", progress: 30, due: "2026-09-08" }, createdAt: "", updatedAt: "", createdBy: "Hieu" },
];

describe("query engine", () => {
  it("evaluates nested AND/OR filter groups", () => {
    const filters: FilterGroup = { id: "root", conjunction: "and", conditions: [
      { id: "not-done", fieldId: "status", operator: "notEquals", value: "Done" },
      { id: "owners", conjunction: "or", conditions: [
        { id: "linh", fieldId: "owner", operator: "equals", value: "Linh" },
        { id: "urgent", fieldId: "progress", operator: "lt", value: 40 },
      ] },
    ] };
    expect(records.filter((record) => matchesFilterGroup(record, filters, fields)).map((record) => record.id)).toEqual(["1", "3"]);
  });

  it("searches after filtering and applies typed multi-sort", () => {
    const result = queryRecords(records, fields, { id: "all", conjunction: "and", conditions: [] }, [{ id: "sort", fieldId: "progress", direction: "desc" }], "i");
    expect(result.map((record) => record.id)).toEqual(["2", "1", "3"]);
  });

  it("supports relative date scopes", () => {
    const filter: FilterGroup = { id: "dates", conjunction: "and", conditions: [{ id: "month", fieldId: "due", operator: "thisMonth" }] };
    expect(records.every((record) => matchesFilterGroup(record, filter, fields, new Date("2026-09-12T08:00:00Z")))).toBe(true);
  });

  it("groups records and applies matching format rules", () => {
    expect(groupRecords(records, "owner").map((group) => [group.label, group.records.length])).toEqual([["Linh", 2], ["Bao", 1]]);
    const rules = [{ id: "complete", name: "Complete", enabled: true, target: "cell" as const, targetFieldId: "progress", style: { foreground: "green" }, conditions: { id: "rule", conjunction: "and" as const, conditions: [{ id: "100", fieldId: "progress", operator: "gte" as const, value: 100 }] } }];
    expect(getRecordFormatting(records[1], rules, fields)).toHaveLength(1);
    expect(getRecordFormatting(records[0], rules, fields)).toHaveLength(0);
  });
});
