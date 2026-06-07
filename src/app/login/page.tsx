import { LoginPageClient } from "./page-client";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            EasySLR Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in to review imported articles.
          </p>
        </div>
        <LoginPageClient />
      </div>
    </div>
  );
}
