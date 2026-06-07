"use client";

import Link from "next/link";
import { useState } from "react";

import { ErrorBanner } from "~/components/ErrorBanner";
import { ImportSummary } from "~/components/ImportSummary";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { api } from "~/trpc/react";
import type { ImportPreviewResult } from "~/server/import/validateRow";

export function ImportPageClient({
  projectId,
  orgSlug,
  projectSlug,
}: {
  projectId: string;
  orgSlug: string;
  projectSlug: string;
}) {
  const utils = api.useUtils();
  const previewMutation = api.import.preview.useMutation();
  const commitMutation = api.import.commit.useMutation();
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setPreview(null);

    if (!file) {
      setFileName(null);
      setFileBase64(null);
      return;
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Please upload an Excel file (.xlsx or .xls).");
      return;
    }

    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        "",
      ),
    );

    setFileName(file.name);
    setFileBase64(base64);

    try {
      const result = await previewMutation.mutateAsync({
        projectId,
        fileBase64: base64,
        fileName: file.name,
      });
      setPreview(result);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to preview import.",
      );
    }
  }

  async function handleCommit() {
    if (!fileBase64) return;
    setError(null);

    try {
      await commitMutation.mutateAsync({
        projectId,
        fileBase64,
        fileName: fileName ?? undefined,
      });
      await utils.project.getBySlug.invalidate({ orgSlug, projectSlug });
      await utils.article.list.invalidate({ projectId });
      window.location.href = `/orgs/${orgSlug}/projects/${projectSlug}`;
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to import articles.",
      );
    }
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          Upload PubMed Excel export
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="mt-2 block w-full text-sm"
          onChange={handleFileChange}
        />
        {fileName ? (
          <p className="mt-2 text-sm text-slate-600">Selected: {fileName}</p>
        ) : null}
      </div>

      {previewMutation.isPending ? (
        <LoadingSpinner label="Validating rows..." />
      ) : null}

      {preview ? (
        <div className="space-y-4">
          <ImportSummary result={preview} />
          <div className="flex gap-3">
            <button
              type="button"
              disabled={preview.validRows.length === 0 || commitMutation.isPending}
              onClick={handleCommit}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {commitMutation.isPending
                ? "Importing..."
                : `Import ${preview.validRows.length} articles`}
            </button>
            <Link
              href={`/orgs/${orgSlug}/projects/${projectSlug}`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
