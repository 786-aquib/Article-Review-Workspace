import * as XLSX from "xlsx";

import {
  type ParsedArticleRow,
  parseCreateDate,
  parsePublicationYear,
  parseString,
} from "./validateRow";

const HEADER_ALIASES: Record<string, keyof Omit<ParsedArticleRow, "rowNumber">> =
  {
    pmid: "pmid",
    title: "title",
    authors: "authors",
    citation: "citation",
    "first author": "firstAuthor",
    "journal/book": "journal",
    "publication year": "publicationYear",
    "create date": "createDate",
    pmcid: "pmcid",
    "nihms id": "nihmsId",
    doi: "doi",
  };

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function cellToString(value: unknown): string {
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

function mapHeaders(
  headers: string[],
): Map<keyof Omit<ParsedArticleRow, "rowNumber">, number> {
  const mapping = new Map<
    keyof Omit<ParsedArticleRow, "rowNumber">,
    number
  >();

  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    const field = HEADER_ALIASES[normalized];
    if (field && !mapping.has(field)) {
      mapping.set(field, index);
    }
  });

  return mapping;
}

function getCellValue(row: unknown[], index: number | undefined): unknown {
  if (index === undefined) {
    return null;
  }
  return row[index] ?? null;
}

export function parseWorkbook(buffer: ArrayBuffer): ParsedArticleRow[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });

  if (rows.length === 0) {
    return [];
  }

  const headerRow = rows[0];
  if (!Array.isArray(headerRow)) {
    return [];
  }

  const headers = headerRow.map((cell) => cellToString(cell));
  const columnMap = mapHeaders(headers);
  const parsedRows: ParsedArticleRow[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!Array.isArray(row)) {
      continue;
    }

    const isEmpty = row.every(
      (cell) => cell === null || cellToString(cell).trim() === "",
    );
    if (isEmpty) {
      continue;
    }

    parsedRows.push({
      rowNumber: index + 1,
      pmid: parseString(getCellValue(row, columnMap.get("pmid"))),
      title: parseString(getCellValue(row, columnMap.get("title"))) ?? "",
      authors: parseString(getCellValue(row, columnMap.get("authors"))),
      citation: parseString(getCellValue(row, columnMap.get("citation"))),
      firstAuthor: parseString(getCellValue(row, columnMap.get("firstAuthor"))),
      journal: parseString(getCellValue(row, columnMap.get("journal"))),
      publicationYear: parsePublicationYear(
        getCellValue(row, columnMap.get("publicationYear")),
      ),
      createDate: parseCreateDate(getCellValue(row, columnMap.get("createDate"))),
      pmcid: parseString(getCellValue(row, columnMap.get("pmcid"))),
      nihmsId: parseString(getCellValue(row, columnMap.get("nihmsId"))),
      doi: parseString(getCellValue(row, columnMap.get("doi"))),
    });
  }

  return parsedRows;
}

export function decodeBase64File(base64: string): ArrayBuffer {
  const binary = Buffer.from(base64, "base64");
  return binary.buffer.slice(
    binary.byteOffset,
    binary.byteOffset + binary.byteLength,
  );
}
