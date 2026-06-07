"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { ReviewStatusBadge } from "~/components/ReviewStatusBadge";
import { api, type RouterOutputs } from "~/trpc/react";
import type { ReviewStatus } from "../../generated/prisma";

type Article = RouterOutputs["article"]["list"][number];

const STATUS_OPTIONS: Array<ReviewStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "INCLUDE",
  "EXCLUDE",
  "MAYBE",
];

export function ArticleTable({
  projectId,
  canEdit,
}: {
  projectId: string;
  canEdit: boolean;
}) {
  const utils = api.useUtils();
  const { data, isLoading, isError, error } = api.article.list.useQuery({
    projectId,
  });
  const updateReview = api.article.updateReview.useMutation({
    onSuccess: async () => {
      await utils.article.list.invalidate({ projectId });
    },
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((article) =>
      statusFilter === "ALL" ? true : article.reviewStatus === statusFilter,
    );
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<Article>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="max-w-md">
            <p className="font-medium text-slate-900">{row.original.title}</p>
            {row.original.citation ? (
              <p className="mt-1 text-xs text-slate-500">{row.original.citation}</p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "firstAuthor",
        header: "First author",
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "journal",
        header: "Journal",
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "publicationYear",
        header: "Year",
        cell: ({ getValue }) => getValue<number | null>() ?? "—",
      },
      {
        accessorKey: "pmid",
        header: "PMID",
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "doi",
        header: "DOI",
        cell: ({ getValue }) => (
          <span className="max-w-[10rem] truncate block">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "reviewStatus",
        header: "Status",
        cell: ({ row }) => (
          <ReviewStatusBadge status={row.original.reviewStatus} />
        ),
      },
      {
        id: "actions",
        header: "Review",
        cell: ({ row }) => {
          const article = row.original;
          const notes =
            notesDraft[article.id] ?? article.reviewNotes ?? "";

          return (
            <div className="min-w-[14rem] space-y-2">
              {canEdit ? (
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={article.reviewStatus}
                  disabled={updateReview.isPending}
                  onChange={(event) => {
                    updateReview.mutate({
                      projectId,
                      articleId: article.id,
                      reviewStatus: event.target.value as ReviewStatus,
                    });
                  }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="INCLUDE">Include</option>
                  <option value="EXCLUDE">Exclude</option>
                  <option value="MAYBE">Maybe</option>
                </select>
              ) : null}
              <textarea
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                rows={2}
                placeholder="Reviewer notes"
                value={notes}
                readOnly={!canEdit}
                onChange={(event) =>
                  setNotesDraft((current) => ({
                    ...current,
                    [article.id]: event.target.value,
                  }))
                }
                onBlur={() => {
                  if (!canEdit) return;
                  const nextNotes = notes.trim();
                  const currentNotes = article.reviewNotes ?? "";
                  if (nextNotes === currentNotes) return;
                  updateReview.mutate({
                    projectId,
                    articleId: article.id,
                    reviewNotes: nextNotes.length > 0 ? nextNotes : null,
                  });
                }}
              />
            </div>
          );
        },
      },
    ],
    [canEdit, notesDraft, projectId, updateReview],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).toLowerCase();
      const article = row.original;
      const haystack = [
        article.title,
        article.authors,
        article.journal,
        article.pmid,
        article.doi,
        article.firstAuthor,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-slate-600">
        Loading articles...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error.message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          placeholder="Search title, authors, journal, PMID, DOI..."
          className="w-full max-w-xl rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                statusFilter === status
                  ? "bg-teal-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: " ↑",
                          desc: " ↓",
                        }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No articles match your filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-slate-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
