"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input } from "../../../components/ui";
import { AuthStatusMessage } from "../_components/AuthStatusMessage";
import { useAuthCredentialsForm } from "../_hooks/useAuthCredentialsForm";
import { getAuthErrorMessage, setToken, signup } from "@/services";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { values, isValid, setFieldValue, markTouched, getErrorFor, markSubmitted } =
    useAuthCredentialsForm();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    markSubmitted();

    if (!isValid || isLoading) {
      return;
    }

    setApiError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await signup(values.email.trim(), values.password);
      setToken(response.token);
      setSuccessMessage(response.message ?? "Account created. Redirecting...");
      router.push("/dashboard");
    } catch (error) {
      setApiError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Create account</h2>
        <p className="text-sm text-slate-400">Start building with QuDrugForge.</p>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          label="Email"
          placeholder="researcher@quinfosys.com"
          value={values.email}
          onChange={(event) => setFieldValue("email", event.target.value)}
          onBlur={() => markTouched("email")}
          error={getErrorFor("email")}
          disabled={isLoading}
          required
        />

        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          label="Password"
          placeholder="Create a strong password"
          value={values.password}
          onChange={(event) => setFieldValue("password", event.target.value)}
          onBlur={() => markTouched("password")}
          error={getErrorFor("password")}
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
          loadingText="Creating account..."
        >
          Sign up
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="transition hover:text-cyan-300">
          Sign in
        </Link>
      </p>
    </section>
  );
}
