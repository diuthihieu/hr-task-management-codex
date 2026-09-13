import type { BaseRecord, FieldDefinition, SavedView } from "@/domain/base";

export type ExportFormat = "csv" | "xlsx";
export type ExportScope = "current" | "selected";

export interface ExportTable {
  fields: FieldDefinition[];
  rows: string[][];
}

export function buildExportTable(
  fields: FieldDefinition[],
  records: BaseRecord[],
  view: SavedView,
  selection: Set<string>,
  scope: ExportScope,
): ExportTable {
  const order = view.columnOrder.length ? view.columnOrder : fields.map((field) => field.id);
  const visibleFields = fields
    .filter((field) => !view.hiddenFieldIds.includes(field.id))
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const scopedRecords = scope === "selected"
    ? records.filter((record) => selection.has(record.id))
    : records;

  return {
    fields: visibleFields,
    rows: scopedRecords.map((record) => visibleFields.map((field) => formatExportValue(record.values[field.id]))),
  };
}

export async function downloadRecords({
  fileName,
  format,
  fields,
  records,
  view,
  selection,
  scope,
}: {
  fileName: string;
  format: ExportFormat;
  fields: FieldDefinition[];
  records: BaseRecord[];
  view: SavedView;
  selection: Set<string>;
  scope: ExportScope;
}) {
  const exported = buildExportTable(fields, records, view, selection, scope);
  const safeName = fileName.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "records";

  if (format === "csv") {
    const content = [
      exported.fields.map((field) => field.name),
      ...exported.rows,
    ].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    triggerDownload(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }), `${safeName}.csv`);
    return exported.rows.length;
  }

  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const header = exported.fields.map((field) => ({ value: field.name, fontWeight: "bold" as const, backgroundColor: "#F3F4F6" }));
  const rows = exported.rows.map((row) => row.map((value) => ({ value })));
  await writeXlsxFile([header, ...rows]).toFile(`${safeName}.xlsx`);
  return exported.rows.length;
}

function formatExportValue(value: BaseRecord["values"][string] | undefined) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function escapeCsv(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
