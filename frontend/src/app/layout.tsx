import type { Metadata } from "next";
import Script from "next/script";
import { DemoProvider } from "@/providers/DemoProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quinfosys™ QuDrugForge",
  description: "Quinfosys™ QuDrugForge - Quantum AI for Drug Discovery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-text antialiased selection:bg-primary/20 selection:text-primary">
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var key='qdrugforge.theme';var stored=localStorage.getItem(key);var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=(stored==='light'||stored==='dark')?stored:(prefersDark?'dark':'light');var root=document.documentElement;root.dataset.theme=theme;root.style.colorScheme=theme;if(theme==='dark'){root.classList.add('dark');}else{root.classList.remove('dark');}}catch(e){}})();`}
        </Script>
        <DemoProvider>
          {children}
        </DemoProvider>
      </body>

    </html>
  );
}
