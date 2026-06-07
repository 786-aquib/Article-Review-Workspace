import { describe, expect, it } from "vitest";

import {
  getDuplicateKey,
  matchesExisting,
  parsePublicationYear,
  validateImportRows,
  type ParsedArticleRow,
} from "~/server/import/validateRow";

function row(overrides: Partial<ParsedArticleRow> = {}): ParsedArticleRow {
  return {
    rowNumber: 2,
    pmid: "12345",
    title: "Sample Article",
    authors: "Doe J",
    citation: null,
    firstAuthor: "Doe J",
    journal: "Demo Journal",
    publicationYear: 2024,
    createDate: null,
    pmcid: null,
    nihmsId: null,
    doi: "10.1000/demo",
    ...overrides,
  };
}

describe("validateImportRows", () => {
  it("skips rows without a title", () => {
    const result = validateImportRows([row({ title: "   " })], []);
    expect(result.validRows).toHaveLength(0);
    expect(result.issues[0]?.reason).toBe("missing_title");
  });

  it("detects duplicates within the uploaded file", () => {
    const result = validateImportRows(
      [row({ rowNumber: 2 }), row({ rowNumber: 3, title: "Sample Article" })],
      [],
    );
    expect(result.validRows).toHaveLength(1);
    expect(result.summary.duplicatesInFile).toBe(1);
  });

  it("detects duplicates already stored in the project", () => {
    const result = validateImportRows([row()], [
      {
        pmid: "12345",
        doi: null,
        title: "Other title",
        publicationYear: null,
      },
    ]);
    expect(result.validRows).toHaveLength(0);
    expect(result.summary.duplicatesInProject).toBe(1);
  });

  it("falls back to title and year for duplicate detection", () => {
    const existing = {
      pmid: null,
      doi: null,
      title: "Sample Article",
      publicationYear: 2024,
    };
    expect(matchesExisting(row({ pmid: null, doi: null }), existing)).toBe(true);
    expect(getDuplicateKey(existing)).toBe("title:sample article:2024");
  });
});

describe("parsePublicationYear", () => {
  it("accepts valid years and rejects invalid values", () => {
    expect(parsePublicationYear("2021")).toBe(2021);
    expect(parsePublicationYear("abc")).toBeNull();
    expect(parsePublicationYear("999")).toBeNull();
  });
});
