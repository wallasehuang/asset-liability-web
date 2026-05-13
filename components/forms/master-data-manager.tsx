"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryRecord, MasterDataCategoryRecord, MasterDataRecord, ItemRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type MasterDataManagerProps = {
  initialData: MasterDataRecord;
};

type FilterType = "all" | CategoryRecord["type"];
type FilterStatus = "all" | "active" | "inactive";
type SortMode = "manual" | "name" | "count";

type MessageState = {
  tone: "success" | "error";
  text: string;
};

type CategoryFormState = {
  type: CategoryRecord["type"];
  code: string;
  name: string;
  sortOrder: string;
};

type ItemFormState = {
  categoryId: string;
  name: string;
  institution: string;
  currency: ItemRecord["currency"];
  sortOrder: string;
  note: string;
};

const emptyCategoryForm = (): CategoryFormState => ({
  type: "asset",
  code: "",
  name: "",
  sortOrder: "0",
});

const emptyItemForm = (categoryId: string): ItemFormState => ({
  categoryId,
  name: "",
  institution: "",
  currency: "TWD",
  sortOrder: "0",
  note: "",
});

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getTypeLabel(type: CategoryRecord["type"]) {
  return type === "asset" ? "資產" : "負債";
}

function getStatusLabel(isActive: boolean) {
  return isActive ? "啟用" : "停用";
}

function matchesStatus(status: FilterStatus, isActive: boolean) {
  if (status === "all") return true;
  return status === "active" ? isActive : !isActive;
}

function categoryMatchesQuery(category: MasterDataCategoryRecord, query: string) {
  if (!query) return true;
  return [category.name, category.code].some((value) => value.toLowerCase().includes(query));
}

function itemMatchesQuery(item: ItemRecord, query: string) {
  if (!query) return true;
  return [item.name, item.institution, item.note].some((value) => value.toLowerCase().includes(query));
}

export function MasterDataManager({ initialData }: MasterDataManagerProps) {
  const [data, setData] = useState(initialData);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialData.categories[0]?.id ?? "");
  const [editingItemId, setEditingItemId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [message, setMessage] = useState<MessageState | null>(null);
  const [showCategoryCreateForm, setShowCategoryCreateForm] = useState(initialData.categories.length === 0);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [showItemCreateForm, setShowItemCreateForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm());
  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm(initialData.categories[0]?.id ?? ""));
  const deferredQuery = useDeferredValue(searchQuery);

  const normalizedQuery = normalizeText(deferredQuery);

  const visibleCategories = [...data.categories]
    .filter((category) => {
      if (typeFilter !== "all" && category.type !== typeFilter) {
        return false;
      }

      const relatedItems = data.items.filter((item) => item.categoryId === category.id);
      const matchesQuery =
        categoryMatchesQuery(category, normalizedQuery) || relatedItems.some((item) => itemMatchesQuery(item, normalizedQuery));
      const matchesAnyStatus =
        statusFilter === "all" ||
        matchesStatus(statusFilter, category.isActive) ||
        relatedItems.some((item) => matchesStatus(statusFilter, item.isActive));

      return matchesQuery && matchesAnyStatus;
    })
    .sort((left, right) => {
      if (sortMode === "name") {
        return left.name.localeCompare(right.name, "zh-Hant");
      }

      if (sortMode === "count") {
        return right.itemCount - left.itemCount || left.name.localeCompare(right.name, "zh-Hant");
      }

      const typeOrder = left.type.localeCompare(right.type);
      if (typeOrder !== 0) return typeOrder;
      return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "zh-Hant");
    });

  useEffect(() => {
    if (!visibleCategories.length) {
      if (selectedCategoryId) {
        setSelectedCategoryId("");
      }
      setShowCategoryEditor(false);
      setShowItemCreateForm(false);
      setEditingItemId("");
      return;
    }

    if (!visibleCategories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(visibleCategories[0]?.id ?? "");
      setShowCategoryEditor(false);
      setEditingItemId("");
    }
  }, [selectedCategoryId, visibleCategories]);

  useEffect(() => {
    if (!data.categories.length) {
      if (itemForm.categoryId) {
        setItemForm(emptyItemForm(""));
      }
      return;
    }

    if (!data.categories.some((category) => category.id === itemForm.categoryId)) {
      setItemForm(emptyItemForm(selectedCategoryId || data.categories[0]?.id || ""));
    }
  }, [data.categories, itemForm.categoryId, selectedCategoryId]);

  const selectedCategory = data.categories.find((category) => category.id === selectedCategoryId) ?? null;

  const visibleItems = data.items
    .filter((item) => item.categoryId === selectedCategoryId)
    .filter((item) => matchesStatus(statusFilter, item.isActive))
    .filter((item) => itemMatchesQuery(item, normalizedQuery))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "zh-Hant"));

  async function refreshMasterData() {
    const response = await fetch("/api/master-data", { cache: "no-store" });
    const nextData = (await response.json()) as MasterDataRecord | { error?: string };

    if (!response.ok || !("categories" in nextData) || !("items" in nextData)) {
      throw new Error("error" in nextData ? nextData.error || "重新整理主檔失敗" : "重新整理主檔失敗");
    }

    setData(nextData);
    return nextData;
  }

  async function createCategory() {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...categoryForm,
        sortOrder: Number(categoryForm.sortOrder),
        isActive: true,
      }),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage({ tone: "error", text: result.error ?? "建立分類失敗" });
      return;
    }

    try {
      const nextData = await refreshMasterData();
      const createdCategory = nextData.categories.find((category) => category.code === categoryForm.code.trim());
      const nextSelectedCategoryId = createdCategory?.id ?? nextData.categories[0]?.id ?? "";

      setSelectedCategoryId(nextSelectedCategoryId);
      setCategoryForm(emptyCategoryForm());
      setItemForm(emptyItemForm(nextSelectedCategoryId));
      setShowCategoryCreateForm(false);
      setShowCategoryEditor(false);
      setShowItemCreateForm(false);
      setMessage({ tone: "success", text: "分類已建立。" });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "重新整理主檔失敗" });
    }
  }

  async function updateCategory(category: CategoryRecord) {
    const response = await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage({ tone: "error", text: result.error ?? "更新分類失敗" });
      return;
    }

    try {
      await refreshMasterData();
      setSelectedCategoryId(category.id);
      setShowCategoryEditor(false);
      setMessage({ tone: "success", text: "分類已更新。" });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "重新整理主檔失敗" });
    }
  }

  async function createItem() {
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...itemForm,
        sortOrder: Number(itemForm.sortOrder),
        isActive: true,
      }),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage({ tone: "error", text: result.error ?? "建立項目失敗" });
      return;
    }

    try {
      await refreshMasterData();
      setSelectedCategoryId(itemForm.categoryId);
      setItemForm(emptyItemForm(itemForm.categoryId));
      setShowItemCreateForm(false);
      setMessage({ tone: "success", text: "項目已建立。" });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "重新整理主檔失敗" });
    }
  }

  async function updateItem(item: ItemRecord) {
    const response = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage({ tone: "error", text: result.error ?? "更新項目失敗" });
      return;
    }

    try {
      await refreshMasterData();
      setSelectedCategoryId(item.categoryId);
      setEditingItemId("");
      setMessage({ tone: "success", text: "項目已更新。" });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "重新整理主檔失敗" });
    }
  }

  function openCategoryCreateForm() {
    setShowCategoryCreateForm(true);
    setShowCategoryEditor(false);
    setMessage(null);
  }

  function openCategoryEditor() {
    setShowCategoryEditor(true);
    setShowCategoryCreateForm(false);
    setMessage(null);
  }

  function openItemCreateForm(categoryId = selectedCategoryId || data.categories[0]?.id || "") {
    setItemForm(emptyItemForm(categoryId));
    setShowItemCreateForm(true);
    setEditingItemId("");
    setMessage(null);
  }

  function selectCategory(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setShowCategoryEditor(false);
    setShowItemCreateForm(false);
    setEditingItemId("");
  }

  function toggleItemEditor(itemId: string) {
    setEditingItemId((current) => (current === itemId ? "" : itemId));
    setShowItemCreateForm(false);
  }

  return (
    <div className="grid gap-8">
      <section className="design-panel section-box grid gap-3 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.7fr))_auto_auto] md:items-center">
        <Input
          placeholder="搜尋分類、項目、機構"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as FilterType)}>
          <option value="all">全部類型</option>
          <option value="asset">資產</option>
          <option value="liability">負債</option>
        </Select>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}>
          <option value="all">全部狀態</option>
          <option value="active">啟用中</option>
          <option value="inactive">停用中</option>
        </Select>
        <Select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
          <option value="manual">依排序</option>
          <option value="name">依名稱</option>
          <option value="count">依項目數</option>
        </Select>
        <Button tone="ghost" className="justify-start md:justify-center" onClick={openCategoryCreateForm}>
          新增分類
        </Button>
        <Button
          tone="ghost"
          className="justify-start md:justify-center"
          onClick={() => openItemCreateForm()}
          disabled={!data.categories.length}
        >
          新增項目
        </Button>
      </section>

      {message ? (
        <div
          className={cn(
            "px-0 py-1 text-sm",
            message.tone === "success" ? "text-[var(--color-muted)]" : "text-[var(--color-alert-ink)]",
          )}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="design-panel section-box grid gap-5 xl:sticky xl:top-8">
          <div className="design-divider grid gap-2">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Categories</div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-[24px] tracking-[0.05em]">分類群組</h2>
              <div className="text-[11px] leading-5 text-[var(--color-muted)]">{visibleCategories.length} 個分類</div>
            </div>
          </div>

          {showCategoryCreateForm ? (
            <section className="grid gap-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">新增分類</div>
              <Input
                placeholder="分類名稱"
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
              />
              <Input
                placeholder="代碼，例如 asset-cash"
                value={categoryForm.code}
                onChange={(event) => setCategoryForm((current) => ({ ...current, code: event.target.value }))}
              />
              <Select
                value={categoryForm.type}
                onChange={(event) => setCategoryForm((current) => ({ ...current, type: event.target.value as CategoryRecord["type"] }))}
              >
                <option value="asset">資產</option>
                <option value="liability">負債</option>
              </Select>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
                <Input
                  type="number"
                  placeholder="排序"
                  value={categoryForm.sortOrder}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, sortOrder: event.target.value }))}
                />
                <Button tone="ghost" onClick={() => setShowCategoryCreateForm(false)}>
                  收合
                </Button>
                <Button onClick={() => startTransition(() => void createCategory())}>建立分類</Button>
              </div>
            </section>
          ) : null}

          <div className="grid max-h-[72vh] gap-5 overflow-y-auto pr-1">
            {visibleCategories.length ? (
              visibleCategories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  isSelected={category.id === selectedCategoryId}
                  isEditing={showCategoryEditor && category.id === selectedCategoryId}
                  visibleItemCount={
                    data.items.filter(
                      (item) =>
                        item.categoryId === category.id &&
                        matchesStatus(statusFilter, item.isActive) &&
                        itemMatchesQuery(item, normalizedQuery),
                    ).length
                  }
                  onSelect={() => selectCategory(category.id)}
                  onEdit={openCategoryEditor}
                  onQuickAddItem={() => {
                    setSelectedCategoryId(category.id);
                    openItemCreateForm(category.id);
                  }}
                  onSave={updateCategory}
                  onCancelEdit={() => setShowCategoryEditor(false)}
                />
              ))
            ) : (
              <div className="py-4 text-sm leading-6 text-[var(--color-muted)]">目前沒有符合搜尋或篩選條件的分類。</div>
            )}
          </div>
        </aside>

        <section className="design-panel section-box grid gap-5">
          <div className="design-divider grid gap-2">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Items</div>
            {selectedCategory ? (
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="grid gap-1">
                  <h2 className="font-display text-[24px] tracking-[0.05em]">{selectedCategory.name}</h2>
                  <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    <span>{getTypeLabel(selectedCategory.type)}</span>
                    <span>{selectedCategory.itemCount} 項</span>
                    <span>{getStatusLabel(selectedCategory.isActive)}</span>
                    <span>排序 {selectedCategory.sortOrder}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-start gap-4 md:justify-end">
                  <Button tone="ghost" onClick={openCategoryEditor}>
                    編輯分類
                  </Button>
                  <Button tone="ghost" onClick={() => openItemCreateForm(selectedCategory.id)}>
                    新增此分類項目
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-6 text-[var(--color-muted)]">先在左側選取分類，或建立第一個分類後再新增項目。</div>
            )}
          </div>

          {showItemCreateForm && data.categories.length ? (
            <section className="grid gap-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">新增項目</div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <Select
                  value={itemForm.categoryId}
                  onChange={(event) => setItemForm((current) => ({ ...current, categoryId: event.target.value }))}
                >
                  {data.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getTypeLabel(category.type)} / {category.name}
                    </option>
                  ))}
                </Select>
                <Input
                  placeholder="項目名稱"
                  value={itemForm.name}
                  onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_120px]">
                <Input
                  placeholder="機構 / 帳戶"
                  value={itemForm.institution}
                  onChange={(event) => setItemForm((current) => ({ ...current, institution: event.target.value }))}
                />
                <Select
                  value={itemForm.currency}
                  onChange={(event) => setItemForm((current) => ({ ...current, currency: event.target.value as ItemRecord["currency"] }))}
                >
                  <option value="TWD">TWD</option>
                  <option value="USD">USD</option>
                </Select>
                <Input
                  type="number"
                  placeholder="排序"
                  value={itemForm.sortOrder}
                  onChange={(event) => setItemForm((current) => ({ ...current, sortOrder: event.target.value }))}
                />
              </div>
              <Textarea
                rows={3}
                placeholder="備註"
                value={itemForm.note}
                onChange={(event) => setItemForm((current) => ({ ...current, note: event.target.value }))}
              />
              <div className="flex flex-wrap justify-end gap-4">
                <Button tone="ghost" onClick={() => setShowItemCreateForm(false)}>
                  收合
                </Button>
                <Button onClick={() => startTransition(() => void createItem())}>建立項目</Button>
              </div>
            </section>
          ) : null}

          {selectedCategory ? (
            <div className="grid gap-5">
              {visibleItems.length ? (
                visibleItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    categories={data.categories}
                    isEditing={editingItemId === item.id}
                    onToggleEdit={() => toggleItemEditor(item.id)}
                    onSave={updateItem}
                    onCancelEdit={() => setEditingItemId("")}
                  />
                ))
              ) : (
                <div className="py-4 text-sm leading-6 text-[var(--color-muted)]">這個分類目前沒有符合條件的項目，可以直接在上方新增。</div>
              )}
            </div>
          ) : (
            <div className="py-4 text-sm leading-6 text-[var(--color-muted)]">找不到可顯示的分類，請先調整搜尋條件或建立新的分類。</div>
          )}
        </section>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  isSelected,
  isEditing,
  visibleItemCount,
  onSelect,
  onEdit,
  onQuickAddItem,
  onSave,
  onCancelEdit,
}: {
  category: MasterDataCategoryRecord;
  isSelected: boolean;
  isEditing: boolean;
  visibleItemCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onQuickAddItem: () => void;
  onSave: (category: CategoryRecord) => Promise<void>;
  onCancelEdit: () => void;
}) {
  const [draft, setDraft] = useState<CategoryRecord>(category);

  useEffect(() => {
    setDraft(category);
  }, [category]);

  const summaryText =
    visibleItemCount === category.itemCount
      ? `${category.itemCount} 項`
      : `${visibleItemCount} / ${category.itemCount} 項`;

  return (
    <article className="grid gap-2 py-1">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "grid w-full gap-1.5 px-0 text-left transition",
          isSelected ? "text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]",
        )}
      >
        <div className="flex items-end justify-between gap-3">
          <div className="font-display text-[20px] tracking-[0.04em]">{category.name}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{summaryText}</div>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          <span>{getTypeLabel(category.type)}</span>
          <span>{category.code}</span>
          <span>{getStatusLabel(category.isActive)}</span>
          <span>排序 {category.sortOrder}</span>
        </div>
      </button>

      {isSelected ? (
        <div className="mt-2 grid gap-3">
          <div className="flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            <Button tone="ghost" className="px-0" onClick={onEdit}>
              編輯分類
            </Button>
            <Button tone="ghost" className="px-0" onClick={onQuickAddItem}>
              新增項目
            </Button>
          </div>

          {isEditing ? (
            <div className="grid gap-3 pt-1">
              <Input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
              <Input
                value={draft.code}
                onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))}
              />
              <Select
                value={draft.type}
                onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as CategoryRecord["type"] }))}
              >
                <option value="asset">資產</option>
                <option value="liability">負債</option>
              </Select>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <Input
                  type="number"
                  value={String(draft.sortOrder)}
                  onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                />
                <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  啟用
                </label>
              </div>
              <div className="flex flex-wrap justify-end gap-4">
                <Button tone="ghost" onClick={onCancelEdit}>
                  收合
                </Button>
                <Button tone="secondary" onClick={() => startTransition(() => void onSave(draft))}>
                  儲存分類
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ItemRow({
  item,
  categories,
  isEditing,
  onToggleEdit,
  onSave,
  onCancelEdit,
}: {
  item: ItemRecord;
  categories: MasterDataCategoryRecord[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: (item: ItemRecord) => Promise<void>;
  onCancelEdit: () => void;
}) {
  const [draft, setDraft] = useState(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  const selectedCategory = categories.find((category) => category.id === draft.categoryId) ?? null;

  return (
    <article className="grid gap-2 py-1">
      <button type="button" onClick={onToggleEdit} className="grid w-full gap-1.5 px-0 text-left transition hover:text-[var(--color-ink)]">
        <div className="grid gap-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_auto] md:items-end">
          <div className="font-medium text-[15px] text-[var(--color-ink)]">{item.name}</div>
          <div className="truncate text-[13px] text-[var(--color-muted)]">{item.institution || "未填機構"}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {isEditing ? "編輯中" : "點擊編輯"}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          <span>{selectedCategory ? getTypeLabel(selectedCategory.type) : item.entryType === "asset" ? "資產" : "負債"}</span>
          <span>{selectedCategory?.name ?? item.categoryName}</span>
          <span>{item.currency}</span>
          <span>排序 {item.sortOrder}</span>
          <span>{getStatusLabel(item.isActive)}</span>
        </div>
      </button>

      {isEditing ? (
        <div className="mt-2 grid gap-3 pt-1">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            <Input
              value={draft.institution}
              placeholder="機構 / 帳戶"
              onChange={(event) => setDraft((current) => ({ ...current, institution: event.target.value }))}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_96px_auto] md:items-center">
            <Select
              value={draft.categoryId}
              onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getTypeLabel(category.type)} / {category.name}
                </option>
              ))}
            </Select>
            <Select
              value={draft.currency}
              onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value as ItemRecord["currency"] }))}
            >
              <option value="TWD">TWD</option>
              <option value="USD">USD</option>
            </Select>
            <Input
              type="number"
              value={String(draft.sortOrder)}
              onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
            />
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
              />
              啟用
            </label>
          </div>
          <Textarea
            rows={2}
            value={draft.note}
            placeholder="備註"
            onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
          />
          <div className="flex flex-wrap justify-end gap-4">
            <Button tone="ghost" onClick={onCancelEdit}>
              收合
            </Button>
            <Button tone="ghost" onClick={() => startTransition(() => void onSave(draft))}>
              儲存項目
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
