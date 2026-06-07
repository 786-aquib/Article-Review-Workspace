import Link from "next/link";

import { auth } from "~/server/auth";

export async function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link href="/orgs" className="text-lg font-semibold text-teal-800">
              EasySLR Workspace
            </Link>
            {title ? (
              <div className="mt-1">
                <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                {subtitle ? (
                  <p className="text-sm text-slate-600">{subtitle}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>{session?.user?.email}</span>
            <Link
              href="/api/auth/signout"
              className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
