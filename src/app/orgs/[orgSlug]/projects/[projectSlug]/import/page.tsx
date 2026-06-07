import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "~/components/AppShell";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { ImportPageClient } from "./import-client";

export default async function ImportPage({
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

  if (project.role === "VIEWER") {
    redirect(`/orgs/${orgSlug}/projects/${projectSlug}`);
  }

  return (
    <AppShell
      title={`Import articles — ${project.name}`}
      subtitle={project.organization.name}
    >
      <div className="mb-4">
        <Link
          href={`/orgs/${orgSlug}/projects/${projectSlug}`}
          className="text-sm text-teal-700 hover:underline"
        >
          ← Back to articles
        </Link>
      </div>
      <ImportPageClient
        projectId={project.id}
        orgSlug={orgSlug}
        projectSlug={projectSlug}
      />
    </AppShell>
  );
}
