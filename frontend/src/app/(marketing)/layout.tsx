import Link from "next/link";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header className="sticky top-0 z-40 border-b backdrop-blur-md" style={{ borderColor: "var(--border)", backgroundColor: "rgba(0,0,0,0.06)" }}>
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="leading-tight" style={{ color: "var(--text)" }}>
            <span className="block text-2xl font-semibold tracking-tight sm:text-3xl">
              Quinfosys<span style={{ verticalAlign: "super", fontSize: "0.65em", lineHeight: 0 }}>™</span> QuDrugForge
            </span>
            <span className="mt-1 block text-xs font-medium sm:text-sm" style={{ color: "var(--muted-text)" }}>
              Quantum AI for Drug Discovery
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm transition" style={{ color: "var(--muted-text)" }}>
              Features
            </Link>
            <Link href="#pricing" className="text-sm transition" style={{ color: "var(--muted-text)" }}>
              Pricing
            </Link>
            <Link href="#workflow" className="text-sm transition" style={{ color: "var(--muted-text)" }}>
              Workflow
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium transition"
              style={{ color: "var(--muted-text)" }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md px-3 py-2 text-sm font-semibold transition"
              style={{ backgroundColor: "var(--accent)", color: "var(--bg)" }}
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}