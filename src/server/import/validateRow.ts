export type ParsedArticleRow = {
  rowNumber: number;
  pmid: string | null;
  title: string;
  authors: string | null;
  citation: string | null;
  firstAuthor: string | null;
  journal: string | null;
  publicationYear: number | null;
  createDate: Date | null;
  pmcid: string | null;
  nihmsId: string | null;
  doi: string | null;
};

export type ExistingArticleKey = {
  pmid: string | null;
  doi: string | null;
  title: string;
  publicationYear: number | null;
};

export type ImportIssueReason =
  | "missing_title"
  | "duplicate_in_file"
  | "duplicate_in_project";

export type ImportIssue = {
  rowNumber: number;
  reason: ImportIssueReason;
  message: string;
  title?: string;
};

export type ImportPreviewResult = {
  validRows: ParsedArticleRow[];
  issues: ImportIssue[];
  summary: {
    total: number;
    valid: number;
    skipped: number;
    duplicatesInFile: number;
    duplicatesInProject: number;
  };
};

export function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getDuplicateKey(row: {
  pmid: string | null;
  doi: string | null;
  title: string;
  publicationYear: number | null;
}): string | null {
  if (row.pmid?.trim()) {
    return `pmid:${row.pmid.trim()}`;
  }
  if (row.doi?.trim()) {
    return `doi:${row.doi.trim().toLowerCase()}`;
  }
  if (row.title.trim()) {
    return `title:${normalizeTitle(row.title)}:${row.publicationYear ?? "na"}`;
  }
  return null;
}

export function matchesExisting(
  row: ParsedArticleRow,
  existing: ExistingArticleKey,
): boolean {
  const rowKey = getDuplicateKey(row);
  const existingKey = getDuplicateKey(existing);
  return rowKey !== null && rowKey === existingKey;
}

export function validateImportRows(
  rows: ParsedArticleRow[],
  existingArticles: ExistingArticleKey[],
): ImportPreviewResult {
  const validRows: ParsedArticleRow[] = [];
  const issues: ImportIssue[] = [];
  const seenKeys = new Set<string>();

  let duplicatesInFile = 0;
  let duplicatesInProject = 0;

  for (const row of rows) {
    if (!row.title.trim()) {
      issues.push({
        rowNumber: row.rowNumber,
        reason: "missing_title",
        message: "Title is required",
      });
      continue;
    }

    const key = getDuplicateKey(row);
    if (key && seenKeys.has(key)) {
      duplicatesInFile += 1;
      issues.push({
        rowNumber: row.rowNumber,
        reason: "duplicate_in_file",
        message: "Duplicate row within the uploaded file",
        title: row.title,
      });
      continue;
    }

    const duplicateInProject = existingArticles.some((existing) =>
      matchesExisting(row, existing),
    );
    if (duplicateInProject) {
      duplicatesInProject += 1;
      issues.push({
        rowNumber: row.rowNumber,
        reason: "duplicate_in_project",
        message: "Article already exists in this project",
        title: row.title,
      });
      continue;
    }

    if (key) {
      seenKeys.add(key);
    }
    validRows.push(row);
  }

  return {
    validRows,
    issues,
    summary: {
      total: rows.length,
      valid: validRows.length,
      skipped: issues.length,
      duplicatesInFile,
      duplicatesInProject,
    },
  };
}

function valueToString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

export function parsePublicationYear(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number.parseInt(valueToString(value).trim(), 10);
  if (Number.isNaN(parsed) || parsed < 1000 || parsed > 9999) {
    return null;
  }
  return parsed;
}

export function parseCreateDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  const parsed = new Date(valueToString(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function parseString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = valueToString(value).trim();
  return text.length > 0 ? text : null;
}
