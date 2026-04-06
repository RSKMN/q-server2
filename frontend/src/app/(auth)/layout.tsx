import { ThemeToggle } from "@/components/shared";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-12" style={{ background: "var(--bg)" }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 10% 15%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 40%), radial-gradient(circle at 85% 18%, color-mix(in srgb, var(--info) 22%, transparent), transparent 42%), radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 48%), linear-gradient(160deg, color-mix(in srgb, var(--bg) 92%, #0b1024 8%), var(--bg))",
        }}
      />
      <div className="pointer-events-none absolute left-[-6rem] top-[-4rem] h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" aria-hidden="true" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <section
        className="relative z-10 w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
        style={{
          borderColor: "color-mix(in srgb, var(--border) 76%, var(--accent) 24%)",
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--card) 88%, transparent), color-mix(in srgb, var(--card) 78%, var(--accent) 22%))",
          boxShadow:
            "0 24px 70px color-mix(in srgb, var(--accent) 16%, transparent), inset 0 1px 0 color-mix(in srgb, var(--card) 70%, #ffffff 30%)",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-45"
          style={{
            backgroundImage:
              "linear-gradient(rgba(126,140,184,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(126,140,184,0.11) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(to bottom, black 0%, black 65%, transparent 100%)",
          }}
        />
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text)" }}>
            Quinfosys<span style={{ verticalAlign: "super", fontSize: "0.65em", lineHeight: 0 }}>™</span> QuDrugForge
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-text)" }}>Quantum AI for Drug Discovery</p>
        </header>

        <div className="relative">{children}</div>
      </section>
    </main>
  );
}