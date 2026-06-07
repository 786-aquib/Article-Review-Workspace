import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const projectRouter = createTRPCRouter({
  listByOrg: protectedProcedure
    .input(z.object({ orgSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUnique({
        where: { slug: input.orgSlug },
        select: { id: true },
      });

      if (!org) {
        return [];
      }

      const orgMembership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: org.id,
          },
        },
      });

      if (!orgMembership) {
        return [];
      }

      const projects = await ctx.db.project.findMany({
        where: { organizationId: org.id },
        include: {
          members: {
            where: { userId: ctx.session.user.id },
            select: { role: true },
          },
          _count: { select: { articles: true } },
        },
        orderBy: { name: "asc" },
      });

      return projects
        .filter((project) => project.members.length > 0)
        .map((project) => ({
          id: project.id,
          name: project.name,
          slug: project.slug,
          role: project.members[0]!.role,
          articleCount: project._count.articles,
        }));
    }),

  getBySlug: protectedProcedure
    .input(z.object({ orgSlug: z.string(), projectSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUnique({
        where: { slug: input.orgSlug },
        select: { id: true, name: true, slug: true },
      });

      if (!org) {
        return null;
      }

      const project = await ctx.db.project.findUnique({
        where: {
          organizationId_slug: {
            organizationId: org.id,
            slug: input.projectSlug,
          },
        },
        include: {
          members: {
            where: { userId: ctx.session.user.id },
            select: { role: true },
          },
          _count: { select: { articles: true } },
        },
      });

      if (!project || project.members.length === 0) {
        return null;
      }

      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        organization: org,
        role: project.members[0]!.role,
        articleCount: project._count.articles,
      };
    }),
});
