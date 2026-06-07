import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "~/components/AppShell";
import { EmptyState } from "~/components/EmptyState";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function OrgsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const orgs = await api.organization.listMine();

  if (orgs.length === 1) {
    redirect(`/orgs/${orgs[0]!.slug}`);
  }

  return (
    <AppShell title="Organizations">
      {orgs.length === 0 ? (
        <EmptyState
          title="No organizations"
          description="Your account is not assigned to any organizations yet."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/orgs/${org.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow"
            >
              <h2 className="text-lg font-semibold text-slate-900">{org.name}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {org.projectCount} projects · {org.role.toLowerCase()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
