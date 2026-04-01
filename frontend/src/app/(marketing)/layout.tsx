import Link from "next/link";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="leading-tight text-slate-100">
            <span className="block text-base font-semibold tracking-tight sm:text-lg">
              QuinfosysTM QuDrugForge
            </span>
            <span className="block text-[11px] font-medium text-cyan-300 sm:text-xs">
              Quantum AI for Drug Discovery
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/features" className="text-sm text-slate-300 transition hover:text-white">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-slate-300 transition hover:text-white">
              Pricing
            </Link>
            <Link href="/about" className="text-sm text-slate-300 transition hover:text-white">
              About
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
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