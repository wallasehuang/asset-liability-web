import { assertSnapshotEditable } from "@/lib/data";
import { calculateAmountTwd } from "@/lib/finance";
import { fail, ok, parseJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { snapshotEntrySchema } from "@/lib/schemas";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = snapshotEntrySchema.parse(await parseJson(request));
    const existingEntry = await prisma.snapshotEntry.findUnique({
      where: { id },
      select: {
        snapshotId: true,
        itemId: true,
        categoryId: true,
        entryType: true,
        categoryCode: true,
        categoryName: true,
        itemName: true,
        institution: true,
        currency: true,
      },
    });

    if (!existingEntry) {
      return fail("找不到指定月結項目", 404);
    }

    await assertSnapshotEditable(existingEntry.snapshotId);

    const isReplacingItem = input.itemId !== existingEntry.itemId;

    const item = isReplacingItem
      ? await prisma.item.findUnique({
          where: { id: input.itemId },
          include: { category: true },
        })
      : null;

    if (isReplacingItem && !item) {
      return fail("找不到指定項目", 404);
    }

    const resolvedCurrency = item?.currency ?? existingEntry.currency;
    const fxRate = resolvedCurrency === "TWD" ? 1 : input.fxRate ?? 1;

    const entry = await prisma.snapshotEntry.update({
      where: { id },
      data: {
        itemId: item?.id ?? existingEntry.itemId,
        categoryId: item?.categoryId ?? existingEntry.categoryId,
        entryType: item?.category.type ?? existingEntry.entryType,
        categoryCode: item?.category.code ?? existingEntry.categoryCode,
        categoryName: item?.category.name ?? existingEntry.categoryName,
        itemName: item?.name ?? existingEntry.itemName,
        institution: item?.institution ?? existingEntry.institution ?? "",
        currency: resolvedCurrency,
        amountOriginal: input.amountOriginal,
        fxRate,
        amountTwd: calculateAmountTwd(input.amountOriginal, fxRate),
        note: input.note || "",
      },
    });

    return ok({ entry });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "更新月結項目失敗");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existingEntry = await prisma.snapshotEntry.findUnique({
      where: { id },
      select: { snapshotId: true },
    });

    if (!existingEntry) {
      return fail("找不到指定月結項目", 404);
    }

    await assertSnapshotEditable(existingEntry.snapshotId);
    await prisma.snapshotEntry.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "刪除月結項目失敗");
  }
}
