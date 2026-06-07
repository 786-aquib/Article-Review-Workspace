import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  projectProcedure,
} from "~/server/api/trpc";
import { canReview } from "~/server/api/permissions";
import { ReviewStatus } from "../../../../generated/prisma";

export const articleRouter = createTRPCRouter({
  list: projectProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.article.findMany({
        where: { projectId: input.projectId },
        include: {
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [{ reviewStatus: "asc" }, { title: "asc" }],
      });
    }),

  updateReview: projectProcedure
    .input(
      z.object({
        projectId: z.string(),
        articleId: z.string(),
        reviewStatus: z.nativeEnum(ReviewStatus).optional(),
        reviewNotes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!canReview(ctx.projectRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Viewers cannot update reviews",
        });
      }

      const article = await ctx.db.article.findFirst({
        where: {
          id: input.articleId,
          projectId: input.projectId,
        },
      });

      if (!article) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      }

      const statusChanged =
        input.reviewStatus !== undefined &&
        input.reviewStatus !== article.reviewStatus;

      return ctx.db.article.update({
        where: { id: article.id },
        data: {
          reviewStatus: input.reviewStatus,
          reviewNotes:
            input.reviewNotes === undefined ? undefined : input.reviewNotes,
          reviewedAt: statusChanged ? new Date() : undefined,
          reviewedById: statusChanged ? ctx.session.user.id : undefined,
        },
        include: {
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    }),
});
