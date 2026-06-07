"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { ErrorBanner } from "~/components/ErrorBanner";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("lead@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/orgs");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <ErrorBanner message={error} /> : null}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          type="email"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          type="password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-xs text-slate-500">
        Demo accounts are seeded on setup. Default password is{" "}
        <code className="rounded bg-slate-100 px-1">password123</code>.
      </p>
    </form>
  );
}
