import type { BaseRecord, KeyResultDefinition, ObjectiveDefinition, OkrStore } from "@/domain/base";

export function keyResultProgress(keyResult: KeyResultDefinition, tasks: BaseRecord[]): number {
  if (keyResult.type === "task") {
    const linked = tasks.filter((task) => task.values.keyResultId === keyResult.id);
    if (!linked.length) return 0;
    let weightedProgress = 0;
    let totalWeight = 0;
    for (const task of linked) {
      const customWeight = Number(task.values.okrContributionWeight);
      const weight = Number.isFinite(customWeight) && customWeight > 0 ? customWeight : 1;
      weightedProgress += clamp(Number(task.values.progress)) * weight;
      totalWeight += weight;
    }
    return totalWeight ? round(weightedProgress / totalWeight) : 0;
  }
  if (keyResult.type === "manual") return round(clamp(keyResult.manualProgress ?? 0));
  const range = keyResult.targetValue - keyResult.startValue;
  if (!range) return keyResult.currentValue >= keyResult.targetValue ? 100 : 0;
  return round(clamp(((keyResult.currentValue - keyResult.startValue) / range) * 100));
}

export function objectiveProgress(objective: ObjectiveDefinition, keyResults: KeyResultDefinition[], tasks: BaseRecord[]): number {
  const children = keyResults.filter((keyResult) => keyResult.objectiveId === objective.id);
  if (!children.length) return 0;
  let weightedProgress = 0;
  let totalWeight = 0;
  for (const keyResult of children) {
    const weight = keyResult.weight > 0 ? keyResult.weight : 1;
    weightedProgress += keyResultProgress(keyResult, tasks) * weight;
    totalWeight += weight;
  }
  return totalWeight ? round(weightedProgress / totalWeight) : 0;
}

export function objectivesForUser(store: OkrStore, tasks: BaseRecord[], currentUser: string) {
  const taskKrIds = new Set(tasks.filter((task) => task.values.owner === currentUser).map((task) => String(task.values.keyResultId ?? "")).filter(Boolean));
  const taskObjectiveIds = new Set(tasks.filter((task) => task.values.owner === currentUser).map((task) => String(task.values.objectiveId ?? "")).filter(Boolean));
  const krObjectiveIds = new Set(store.keyResults.filter((keyResult) => keyResult.owner === currentUser || taskKrIds.has(keyResult.id)).map((keyResult) => keyResult.objectiveId));
  return store.objectives.filter((objective) => objective.owner === currentUser || objective.contributors.includes(currentUser) || taskObjectiveIds.has(objective.id) || krObjectiveIds.has(objective.id));
}

export function effectiveUrgency(task: BaseRecord, autoDays: number | null, today = new Date()): "Urgent" | "Not Urgent" {
  if (autoDays == null) return task.values.urgency === "Urgent" ? "Urgent" : "Not Urgent";
  const due = parseDate(task.values.dueDate);
  if (!due) return "Not Urgent";
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const days = Math.ceil((due.getTime() - start) / 86_400_000);
  return days <= autoDays ? "Urgent" : "Not Urgent";
}

export function okrTaskRecords(store: OkrStore, tasks: BaseRecord[], currentUser: string) {
  const objectiveIds = new Set(objectivesForUser(store, tasks, currentUser).map((objective) => objective.id));
  return tasks.filter((task) => task.values.owner === currentUser || objectiveIds.has(String(task.values.objectiveId ?? "")));
}

function parseDate(value: BaseRecord["values"][string] | undefined) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return undefined;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function clamp(value: number) { return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)); }
function round(value: number) { return Math.round(value * 10) / 10; }
