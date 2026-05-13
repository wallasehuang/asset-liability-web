"use client";

import { startTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CategoryRecord } from "@/lib/types";

type CategoryManagerProps = {
  initialCategories: CategoryRecord[];
};

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    type: "asset",
    code: "",
    name: "",
    sortOrder: "0",
  });

  async function createCategory() {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sortOrder: Number(form.sortOrder),
        isActive: true,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "建立分類失敗");
      return;
    }

    setCategories(data.categories);
    setForm({ type: "asset", code: "", name: "", sortOrder: "0" });
    setMessage("分類已建立");
  }

  async function updateCategory(category: CategoryRecord) {
    const response = await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    const data = await response.json();
    setMessage(response.ok ? "分類已更新" : (data.error ?? "更新失敗"));
    if (response.ok) {
      setCategories(data.categories);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="design-panel section-box grid gap-4 border border-[var(--color-line)] bg-[var(--color-surface)] p-5 md:grid-cols-5 md:p-6">
        <Select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
          <option value="asset">資產</option>
          <option value="liability">負債</option>
        </Select>
        <Input placeholder="代碼，例如 asset-cash" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
        <Input placeholder="分類名稱" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <Input type="number" placeholder="排序" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} />
        <Button
          onClick={() => startTransition(() => void createCategory())}
          className="w-full"
        >
          新增分類
        </Button>
      </section>

      {message ? <div className="text-sm text-[var(--color-muted)]">{message}</div> : null}

      <section className="design-panel overflow-hidden border border-[var(--color-line)]">
        <div className="hidden grid-cols-[120px_1fr_1fr_100px_100px_120px] border-b border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--color-muted)] md:grid">
          <div>類型</div>
          <div>代碼</div>
          <div>名稱</div>
          <div>排序</div>
          <div>啟用</div>
          <div>操作</div>
        </div>
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} onSave={updateCategory} />
        ))}
      </section>
    </div>
  );
}

function CategoryRow({
  category,
  onSave,
}: {
  category: CategoryRecord;
  onSave: (category: CategoryRecord) => Promise<void>;
}) {
  const [draft, setDraft] = useState(category);

  return (
    <div className="design-row-card grid gap-3 border-b border-[var(--color-line)] bg-[var(--color-bone)] p-4 md:grid-cols-[120px_1fr_1fr_100px_100px_120px] md:items-center">
      <Select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as "asset" | "liability" }))}>
        <option value="asset">資產</option>
        <option value="liability">負債</option>
      </Select>
      <Input value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} />
      <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
      <Input
        type="number"
        value={String(draft.sortOrder)}
        onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
      />
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
        />
        啟用
      </label>
      <Button tone="ghost" onClick={() => startTransition(() => void onSave(draft))}>
        儲存
      </Button>
    </div>
  );
}
