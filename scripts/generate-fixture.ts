import * as XLSX from "xlsx";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const headers = [
  "PMID",
  "Title",
  "Authors",
  "Citation",
  "First Author",
  "Journal/Book",
  "Publication Year",
  "Create Date",
  "PMCID",
  "NIHMS ID",
  "DOI",
];

const rows = [
  headers,
  [
    "11111111",
    "Effect of intervention A on outcome B",
    "Smith J, Jones K",
    "Smith J, Demo Journal. 2023;1:1-10.",
    "Smith J",
    "Demo Journal",
    2023,
    "2024-01-15",
    "",
    "",
    "10.1000/demo.111",
  ],
  [
    "22222222",
    "Duplicate by PMID row",
    "Lee A",
    "",
    "Lee A",
    "Demo Journal",
    2022,
    "",
    "",
    "",
    "10.1000/demo.222",
  ],
  [
    "22222222",
    "Duplicate within file",
    "Lee A",
    "",
    "Lee A",
    "Demo Journal",
    2022,
    "",
    "",
    "",
    "10.1000/demo.222-dup",
  ],
  [
    "",
    "",
    "Missing title row",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ],
  [
    "",
    "Incomplete metadata but valid title",
    "",
    "",
    "",
    "",
    "not-a-year",
    "invalid-date",
    "",
    "",
    "",
  ],
];

const worksheet = XLSX.utils.aoa_to_sheet(rows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Articles");

const fixturesDir = path.join(process.cwd(), "fixtures");
mkdirSync(fixturesDir, { recursive: true });

const outputPath = path.join(fixturesDir, "sample_article_import.xlsx");
writeFileSync(outputPath, XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

console.log(`Wrote ${outputPath}`);
