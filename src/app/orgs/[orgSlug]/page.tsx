import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "~/components/AppShell";
import { EmptyState } from "~/components/EmptyState";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function OrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { orgSlug } = await params;
  const org = await api.organization.getBySlug({ orgSlug });
  if (!org) {
    notFound();
  }

  const projects = await api.project.listByOrg({ orgSlug });

  return (
    <AppShell title={org.name} subtitle="Projects you can access">
      <div className="mb-4">
        <Link href="/orgs" className="text-sm text-teal-700 hover:underline">
          ← All organizations
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No accessible projects"
          description="You are a member of this organization but have not been added to any projects yet."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/orgs/${orgSlug}/projects/${project.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {project.name}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {project.articleCount} articles · {project.role.toLowerCase()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
