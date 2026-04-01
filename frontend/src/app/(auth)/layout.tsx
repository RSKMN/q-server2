export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_40%)]"
      />

      <section className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
            Welcome to QuinfosysTM QuDrugForge
          </h1>
          <p className="mt-2 text-sm text-cyan-300">Quantum AI for Drug Discovery</p>
        </header>

        <div>{children}</div>
      </section>
    </main>
  );
}