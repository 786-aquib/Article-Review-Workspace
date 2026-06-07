"use client";

import { SessionProvider } from "next-auth/react";

import { LoginForm } from "./login-form";

export function LoginPageClient() {
  return (
    <SessionProvider>
      <LoginForm />
    </SessionProvider>
  );
}
