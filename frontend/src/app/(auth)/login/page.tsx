"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input } from "../../../components/ui";
import { AuthStatusMessage } from "../_components/AuthStatusMessage";
import { useAuthCredentialsForm } from "../_hooks/useAuthCredentialsForm";
import { setToken } from "@/services";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { values, isValid, setFieldValue, markTouched, getErrorFor, markSubmitted } =
    useAuthCredentialsForm({
      requireValidEmailFormat: false,
      passwordMinLength: 1,
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    markSubmitted();

    if (isLoading) {
      return;
    }

    const email = values.email.trim();
    const password = values.password.trim();

    if (!email || !password) {
      setSuccessMessage(null);
      setFormError("Email and password are required.");
      return;
    }

    if (!isValid) {
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setToken(`mock-auth-token-${Date.now()}`);
    setSuccessMessage("Signed in successfully. Redirecting...");
    router.push("/dashboard");
    setIsLoading(false);
  };

  return (
    <section className="space-y-7">
      <header className="space-y-2.5 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.72rem]" style={{ color: "var(--text)" }}>
          Sign in
        </h2>
        <p className="text-sm leading-6" style={{ color: "var(--muted-text)" }}>
          Access your research workspace.
        </p>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          label="Email"
          placeholder="researcher@quinfosys.com"
          containerClassName="auth-input-group"
          className="auth-input"
          value={values.email}
          onChange={(event) => setFieldValue("email", event.target.value)}
          onBlur={() => markTouched("email")}
          error={getErrorFor("email")}
          disabled={isLoading}
          required
        />

        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          label="Password"
          placeholder="Enter your password"
          containerClassName="auth-input-group"
          className="auth-input"
          value={values.password}
          onChange={(event) => setFieldValue("password", event.target.value)}
          onBlur={() => markTouched("password")}
          error={getErrorFor("password")}
          disabled={isLoading}
          required
        />

        {formError ? <AuthStatusMessage type="error" message={formError} /> : null}
        {successMessage ? <AuthStatusMessage type="success" message={successMessage} /> : null}

        <Button
          type="submit"
          className="ui-button w-full rounded-xl py-3"
          disabled={!isValid || isLoading}
          isLoading={isLoading}
          loadingText="Signing in..."
        >
          Sign in
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm" style={{ color: "var(--muted-text)" }}>
        <Link href="/forgot-password" className="transition" style={{ color: "var(--accent)" }}>
          Forgot password?
        </Link>
        <Link href="/signup" className="transition" style={{ color: "var(--accent)" }}>
          Create account
        </Link>
      </div>
    </section>
  );
}