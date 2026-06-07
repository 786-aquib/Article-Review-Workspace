import type { ImportPreviewResult } from "~/server/import/validateRow";

export function ImportSummary({ result }: { result: ImportPreviewResult | {
  summary: ImportPreviewResult["summary"];
  issues: ImportPreviewResult["issues"];
} }) {
  const { summary, issues } = result;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total rows" value={summary.total} />
        <Stat label="Ready to import" value={summary.valid} />
        <Stat label="Skipped" value={summary.skipped} />
        <Stat label="Duplicates in file" value={summary.duplicatesInFile} />
      </div>

      {issues.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-900">
            Validation issues ({issues.length})
          </div>
          <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto text-sm">
            {issues.slice(0, 20).map((issue) => (
              <li key={`${issue.rowNumber}-${issue.reason}`} className="px-4 py-2">
                <span className="font-medium">Row {issue.rowNumber}:</span>{" "}
                {issue.message}
                {issue.title ? ` — ${issue.title}` : ""}
              </li>
            ))}
          </ul>
          {issues.length > 20 ? (
            <p className="px-4 py-2 text-xs text-slate-500">
              Showing first 20 issues.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
