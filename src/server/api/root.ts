import { articleRouter } from "~/server/api/routers/article";
import { importRouter } from "~/server/api/routers/import";
import { organizationRouter } from "~/server/api/routers/organization";
import { projectRouter } from "~/server/api/routers/project";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  organization: organizationRouter,
  project: projectRouter,
  article: articleRouter,
  import: importRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
