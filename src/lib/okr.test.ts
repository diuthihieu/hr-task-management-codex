import { describe, expect, it } from "vitest";
import type { BaseRecord, KeyResultDefinition, ObjectiveDefinition } from "@/domain/base";
import { keyResultProgress, objectiveProgress } from "./okr";

const task = (id: string, progress: number, weight?: number): BaseRecord => ({
  id,
  values: { keyResultId: "kr-1", progress, okrContributionWeight: weight ?? null },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdBy: "QA",
});
const taskKr: KeyResultDefinition = { id: "kr-1", objectiveId: "objective-1", title: "KR 1", owner: "QA", type: "task", targetValue: 100, currentValue: 0, startValue: 0, unit: "%", weight: 60, status: "On Track" };
const objective: ObjectiveDefinition = { id: "objective-1", title: "Objective", description: "", teamId: "team-1", owner: "QA", contributors: [], cycleId: "cycle-1", startDate: "2026-01-01", endDate: "2026-03-31", status: "On Track", confidence: 80, priority: "High" };

describe("OKR roll-ups", () => {
  it("uses task contribution weights and equal fallbacks", () => {
    expect(keyResultProgress(taskKr, [task("a", 100, 40), task("b", 50, 40), task("c", 0, 20)])).toBe(60);
    expect(keyResultProgress(taskKr, [task("a", 100), task("b", 50)])).toBe(75);
  });

  it("calculates numeric and manual key results", () => {
    expect(keyResultProgress({ ...taskKr, type: "numeric", startValue: 100, currentValue: 130, targetValue: 150 }, [])).toBe(60);
    expect(keyResultProgress({ ...taskKr, type: "manual", manualProgress: 42 }, [])).toBe(42);
  });

  it("rolls key results into an objective using KR weights", () => {
    const manual = { ...taskKr, id: "kr-2", type: "manual" as const, manualProgress: 50, weight: 40 };
    expect(objectiveProgress(objective, [taskKr, manual], [task("a", 100)] )).toBe(80);
  });
});
