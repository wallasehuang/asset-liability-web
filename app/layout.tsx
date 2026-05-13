import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "資產負債月結工具",
  description: "以月結快照管理個人資產、負債與淨資產趨勢。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" data-design="b">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
