"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, Input } from "../../../components/ui";
import { AuthStatusMessage } from "../_components/AuthStatusMessage";
import { validateEmail } from "../_hooks/useAuthCredentialsForm";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailError = validateEmail(email);
  const isValid = !emailError;
  const showEmailError = (isTouched || submitted) && emailError;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (!isValid || isLoading) {
      return;
    }

    setApiError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccessMessage("Reset link sent (mock)");
    } catch {
      setApiError("Unable to send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Forgot password</h2>
        <p className="text-sm text-slate-400">We will send a reset link to your email.</p>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="forgot-password-email"
          name="email"
          type="email"
          autoComplete="email"
          label="Email"
          placeholder="researcher@quinfosys.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setIsTouched(true)}
          error={showEmailError ? emailError : undefined}
          disabled={isLoading}
          required
        />

        {apiError ? <AuthStatusMessage type="error" message={apiError} /> : null}
        {successMessage ? <AuthStatusMessage type="success" message={successMessage} /> : null}

        <Button
          type="submit"
          className="w-full"
          disabled={!isValid || isLoading}
          isLoading={isLoading}
          loadingText="Sending link..."
        >
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400">
        Remembered your password?{" "}
        <Link href="/login" className="transition hover:text-cyan-300">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
