"use client";

import { useActionState } from "react";
import {
  authenticateOwner,
  type LoginState,
} from "@/app/admin/actions/auth";

const initialState: LoginState = { message: "" };

export default function OwnerLoginForm() {
  const [state, formAction, pending] = useActionState(
    authenticateOwner,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <label className="block text-left">
        <span className="block text-sm font-semibold text-brand-900">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="brand-input"
        />
      </label>

      <label className="block text-left">
        <span className="block text-sm font-semibold text-brand-900">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="brand-input"
        />
      </label>

      {state.message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="brand-button-gold w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
