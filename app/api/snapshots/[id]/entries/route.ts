import { assertSnapshotEditable } from "@/lib/data";
import { calculateAmountTwd } from "@/lib/finance";
import { fail, ok, parseJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { snapshotEntrySchema } from "@/lib/schemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = snapshotEntrySchema.parse(await parseJson(request));
    await assertSnapshotEditable(id);

    const item = await prisma.item.findUnique({
      where: { id: input.itemId },
      include: { category: true },
    });

    if (!item) {
      return fail("找不到指定項目", 404);
    }

    const entry = await prisma.snapshotEntry.create({
      data: {
        snapshotId: id,
        itemId: item.id,
        categoryId: item.categoryId,
        entryType: item.category.type,
        categoryCode: item.category.code,
        categoryName: item.category.name,
        itemName: item.name,
        institution: item.institution ?? "",
        currency: item.currency,
        amountOriginal: input.amountOriginal,
        fxRate: item.currency === "TWD" ? 1 : input.fxRate ?? 1,
        amountTwd: calculateAmountTwd(input.amountOriginal, item.currency === "TWD" ? 1 : input.fxRate ?? 1),
        note: input.note || "",
      },
    });

    return ok({ entry });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "新增月結項目失敗");
  }
}
