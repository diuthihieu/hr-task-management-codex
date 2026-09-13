import { describe, expect, it } from "vitest";
import { initialAppState } from "@/data/hr-demo";
import { normalizeAppState } from "./state";

describe("normalizeAppState", () => {
  it("falls back to a valid demo for corrupt storage", () => {
    const result = normalizeAppState({ broken: true });
    expect(result.activeTableId).toBe("table-tasks");
    expect(result.workspaces[0].bases[0].tables[0].records).toHaveLength(18);
  });

  it("migrates legacy demo data without replacing edited records", () => {
    const legacy = structuredClone(initialAppState);
    const table = legacy.workspaces[0].bases[0].tables[0];
    table.fields = table.fields.filter((field) => field.id !== "dependencies");
    table.views = table.views.filter((view) => !["view-gantt", "view-gallery", "view-form"].includes(view.id));
    table.records[0].values.taskName = "Edited legacy task";

    const result = normalizeAppState(legacy);
    const migrated = result.workspaces[0].bases[0].tables[0];
    expect(migrated.records[0].values.taskName).toBe("Edited legacy task");
    expect(migrated.fields.some((field) => field.id === "dependencies")).toBe(true);
    expect(migrated.views.map((view) => view.kind)).toEqual(expect.arrayContaining(["gantt", "gallery", "form"]));
  });

  it("applies newly shipped hidden fields once while migrating an older store", () => {
    const legacy = structuredClone(initialAppState);
    const taskTable = legacy.workspaces[0].bases[0].tables[0];
    taskTable.views[0].hiddenFieldIds = taskTable.views[0].hiddenFieldIds.filter((id) => id !== "dependencies");

    const migrated = normalizeAppState(legacy, true).workspaces[0].bases[0].tables[0];
    expect(migrated.views[0].hiddenFieldIds).toContain("dependencies");

    migrated.views[0].hiddenFieldIds = migrated.views[0].hiddenFieldIds.filter((id) => id !== "dependencies");
    const reloaded = normalizeAppState({ ...legacy, workspaces: [{ ...legacy.workspaces[0], bases: [{ ...legacy.workspaces[0].bases[0], tables: [migrated, ...legacy.workspaces[0].bases[0].tables.slice(1)] }] }] });
    expect(reloaded.workspaces[0].bases[0].tables[0].views[0].hiddenFieldIds).not.toContain("dependencies");
  });
});
