import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "~/components/AppShell";
import { ArticleTable } from "~/components/ArticleTable";
import { EmptyState } from "~/components/EmptyState";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { orgSlug, projectSlug } = await params;
  const project = await api.project.getBySlug({ orgSlug, projectSlug });

  if (!project) {
    notFound();
  }

  const canEdit = project.role === "LEAD" || project.role === "REVIEWER";
  const canImport = canEdit;

  return (
    <AppShell
      title={project.name}
      subtitle={`${project.organization.name} · ${project.articleCount} articles · ${project.role.toLowerCase()}`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/orgs/${orgSlug}`}
          className="text-sm text-teal-700 hover:underline"
        >
          ← Back to projects
        </Link>
        {canImport ? (
          <Link
            href={`/orgs/${orgSlug}/projects/${projectSlug}/import`}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Import Excel
          </Link>
        ) : null}
      </div>

      {project.articleCount === 0 ? (
        <EmptyState
          title="No articles yet"
          description="Import a PubMed Excel export to start screening articles for this project."
          actionLabel={canImport ? "Import Excel" : undefined}
          actionHref={
            canImport
              ? `/orgs/${orgSlug}/projects/${projectSlug}/import`
              : undefined
          }
        />
      ) : (
        <ArticleTable projectId={project.id} canEdit={canEdit} />
      )}
    </AppShell>
  );
}
