import { describe, expect, it } from "vitest";
import { initialAppState } from "@/data/hr-demo";
import { buildExportTable } from "./export";

const table = initialAppState.workspaces[0].bases[0].tables[0];
const view = table.views[0];

describe("buildExportTable", () => {
  it("exports current records using only visible fields in view order", () => {
    const result = buildExportTable(table.fields, table.records.slice(0, 2), view, new Set(), "current");
    expect(result.rows).toHaveLength(2);
    expect(result.fields[0].id).toBe("taskName");
    expect(result.fields.some((field) => field.id === "dependencies")).toBe(false);
    expect(result.fields.some((field) => field.id === "createdBy")).toBe(false);
  });

  it("limits selected export to selected records", () => {
    const result = buildExportTable(table.fields, table.records, view, new Set(["task-2", "task-4"]), "selected");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0][0]).toBe("Renew expiring labor contracts");
  });
});
