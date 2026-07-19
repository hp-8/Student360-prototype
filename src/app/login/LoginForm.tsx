"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-[var(--paper-line)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy)]/30 focus:border-[var(--navy)]/50"
          placeholder="you@student360.test"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-[var(--paper-line)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy)]/30 focus:border-[var(--navy)]/50"
          placeholder="••••••••"
        />
      </div>
      {state.error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-md bg-[var(--navy)] text-white py-2 text-sm font-medium hover:bg-[var(--navy-deep)] disabled:opacity-50 transition-colors"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
