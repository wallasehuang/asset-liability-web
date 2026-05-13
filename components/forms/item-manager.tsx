"use client";

import { startTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CategoryRecord, ItemRecord } from "@/lib/types";

type ItemManagerProps = {
  categories: CategoryRecord[];
  initialItems: ItemRecord[];
};

export function ItemManager({ categories, initialItems }: ItemManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    categoryId: categories[0]?.id ?? "",
    name: "",
    institution: "",
    currency: "TWD",
    sortOrder: "0",
    note: "",
  });

  async function createItem() {
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sortOrder: Number(form.sortOrder),
        isActive: true,
      }),
    });

    const data = await response.json();
    setMessage(response.ok ? "項目已建立" : (data.error ?? "建立失敗"));
    if (response.ok) {
      setItems(data.items);
      setForm({
        categoryId: categories[0]?.id ?? "",
        name: "",
        institution: "",
        currency: "TWD",
        sortOrder: "0",
        note: "",
      });
    }
  }

  async function updateItem(item: ItemRecord) {
    const response = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    const data = await response.json();
    setMessage(response.ok ? "項目已更新" : (data.error ?? "更新失敗"));
    if (response.ok) {
      setItems(data.items);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="design-panel section-box grid gap-4 border border-[var(--color-line)] bg-[var(--color-surface)] p-5 md:grid-cols-6 md:p-6">
        <Select value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Input placeholder="項目名稱" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <Input placeholder="機構 / 帳戶" value={form.institution} onChange={(event) => setForm((current) => ({ ...current, institution: event.target.value }))} />
        <Select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}>
          <option value="TWD">TWD</option>
          <option value="USD">USD</option>
        </Select>
        <Input type="number" placeholder="排序" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} />
        <Button onClick={() => startTransition(() => void createItem())}>新增項目</Button>
      </section>

      {message ? <div className="text-sm text-[var(--color-muted)]">{message}</div> : null}

      <section className="grid gap-4">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} categories={categories} onSave={updateItem} />
        ))}
      </section>
    </div>
  );
}

function ItemRow({
  item,
  categories,
  onSave,
}: {
  item: ItemRecord;
  categories: CategoryRecord[];
  onSave: (item: ItemRecord) => Promise<void>;
}) {
  const [draft, setDraft] = useState(item);

  return (
    <article className="design-row-card grid gap-4 border border-[var(--color-line)] bg-[var(--color-bone)] p-5 md:grid-cols-[1.2fr_1fr_120px_100px_90px_140px] md:items-center">
      <div className="grid gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">分類</div>
        <Select value={draft.categoryId} onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.type === "asset" ? "資產" : "負債"} / {category.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">項目 / 機構</div>
        <div className="grid gap-2">
          <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          <Input value={draft.institution} onChange={(event) => setDraft((current) => ({ ...current, institution: event.target.value }))} />
        </div>
      </div>
      <div className="grid gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">幣別</div>
        <Select value={draft.currency} onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value as "TWD" | "USD" }))}>
          <option value="TWD">TWD</option>
          <option value="USD">USD</option>
        </Select>
      </div>
      <div className="grid gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">排序</div>
        <Input type="number" value={String(draft.sortOrder)} onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
      </div>
      <label className="grid gap-2 text-sm">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">啟用</span>
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
          className="h-5 w-5"
        />
      </label>
      <Button tone="ghost" onClick={() => startTransition(() => void onSave(draft))}>
        儲存
      </Button>
    </article>
  );
}
