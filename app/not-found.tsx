import Link from "next/link";

import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid gap-10">
      <PageIntro
        eyebrow="404"
        title="找不到這個頁面"
        description="這個網址目前沒有對應內容。可能是連結已失效、頁面尚未建立，或你剛剛輸入了不存在的路徑。"
      />

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
        <article className="design-panel section-box grid gap-3 border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <div className="design-divider grid gap-2 border-b border-[var(--color-line)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Missing route</div>
            <h2 className="font-display text-[26px] tracking-[0.05em]">這頁不存在</h2>
          </div>

          <div className="grid gap-2 text-[13px] leading-7 text-[var(--color-muted)]">
            <p>如果你原本想打開某個月結，可能是該月份尚未建立，或網址裡的 id 已經失效。</p>
            <p>如果你只是想回到主要功能區，可以從下面兩個入口繼續。</p>
          </div>
        </article>

        <aside className="design-panel section-box grid content-start gap-2.5 border border-[var(--color-line)] bg-[var(--color-bone)] p-5">
          <div className="design-divider grid gap-2 border-b border-[var(--color-line)] pb-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Next step</div>
            <h2 className="font-display text-[24px] tracking-[0.05em]">從這裡返回</h2>
          </div>

          <div className="grid gap-2">
            <Link href="/snapshots">
              <Button className="w-full justify-between" tone="ghost" size="sm">
                <span>回到月結列表</span>
                <span>01</span>
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full justify-between" tone="ghost" size="sm">
                <span>回到首頁儀表板</span>
                <span>02</span>
              </Button>
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
