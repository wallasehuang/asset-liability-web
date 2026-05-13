import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/snapshots", label: "月結" },
  { href: "/master-data", label: "主檔" },
  { href: "/reports", label: "報表" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="design-shell min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)]">
      <header className="design-header border-b border-[var(--color-line)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-8 lg:px-12">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-2">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-muted)]">Asset / Liability Monthly System</div>
              <Link href="/" className="font-display text-[34px] leading-none tracking-[0.03em] md:text-[42px]">
                Balance Ledger
              </Link>
            </div>
            <div className="grid gap-3 md:justify-items-end">
              <div className="max-w-xl justify-self-start text-[11px] leading-5 text-[var(--color-muted)] md:justify-self-end">
                以月結快照管理資產、負債與淨資產趨勢，優先保持輸入效率與閱讀清晰度。
              </div>
            </div>
          </div>
          <nav className="shell-nav flex flex-wrap gap-2">
            {links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shell-nav-link inline-flex items-center gap-1.5 border border-[var(--color-line)] bg-[var(--color-bone)] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] transition hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)]",
                )}
              >
                <span className="text-[var(--color-muted)]">{String(index + 1).padStart(2, "0")}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 lg:px-12">{children}</main>
    </div>
  );
}
