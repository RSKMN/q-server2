export function FooterSection() {
  return (
    <footer className="rounded-3xl border border-border/70 bg-background px-6 py-10 md:px-10 md:py-12">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-heading text-xl text-text">QuinfosysTM QuDrugForge</p>
          <p className="mt-2 font-body text-sm text-text-muted">
            Quantum AI for Drug Discovery
          </p>
        </div>

        <div className="flex flex-wrap gap-6 font-body text-sm text-text-muted">
          <a className="transition hover:text-accent" href="#features">
            Features
          </a>
          <a className="transition hover:text-accent" href="#pricing">
            Pricing
          </a>
          <a className="transition hover:text-accent" href="#contact">
            Contact
          </a>
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-5">
        <p className="font-body text-xs text-text-subtle">
          Copyright {new Date().getFullYear()} QuinfosysTM QuDrugForge. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}