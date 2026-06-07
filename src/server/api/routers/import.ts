import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { canImport } from "~/server/api/permissions";
import {
  createTRPCRouter,
  projectProcedure,
} from "~/server/api/trpc";
import type { db as database } from "~/server/db";
import {
  decodeBase64File,
  parseWorkbook,
} from "~/server/import/parseArticles";
import { validateImportRows } from "~/server/import/validateRow";

const fileInput = z.object({
  projectId: z.string(),
  fileBase64: z.string().min(1),
  fileName: z.string().optional(),
});

async function buildPreview(
  ctx: { db: typeof database },
  projectId: string,
  fileBase64: string,
) {
  const buffer = decodeBase64File(fileBase64);
  const parsedRows = parseWorkbook(buffer);

  const existingArticles = await ctx.db.article.findMany({
    where: { projectId },
    select: {
      pmid: true,
      doi: true,
      title: true,
      publicationYear: true,
    },
  });

  return validateImportRows(parsedRows, existingArticles);
}

export const importRouter = createTRPCRouter({
  preview: projectProcedure.input(fileInput).mutation(async ({ ctx, input }) => {
    if (!canImport(ctx.projectRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to import articles",
      });
    }

    return buildPreview(ctx, input.projectId, input.fileBase64);
  }),

  commit: projectProcedure.input(fileInput).mutation(async ({ ctx, input }) => {
    if (!canImport(ctx.projectRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to import articles",
      });
    }

    const preview = await buildPreview(ctx, input.projectId, input.fileBase64);
    const importBatchId = crypto.randomUUID();

    if (preview.validRows.length === 0) {
      return {
        importBatchId,
        importedCount: 0,
        summary: preview.summary,
        issues: preview.issues,
      };
    }

    await ctx.db.article.createMany({
      data: preview.validRows.map((row) => ({
        projectId: input.projectId,
        pmid: row.pmid,
        title: row.title,
        authors: row.authors,
        citation: row.citation,
        firstAuthor: row.firstAuthor,
        journal: row.journal,
        publicationYear: row.publicationYear,
        createDate: row.createDate,
        pmcid: row.pmcid,
        nihmsId: row.nihmsId,
        doi: row.doi,
        importBatchId,
      })),
    });

    return {
      importBatchId,
      importedCount: preview.validRows.length,
      summary: preview.summary,
      issues: preview.issues,
    };
  }),
});
