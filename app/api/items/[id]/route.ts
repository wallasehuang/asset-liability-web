import { itemSchema } from "@/lib/schemas";
import { fail, ok, parseJson } from "@/lib/http";
import { getItems } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = itemSchema.parse(await parseJson(request));
    await prisma.item.update({
      where: { id },
      data: {
        ...input,
        institution: input.institution || "",
        note: input.note || "",
      },
    });
    return ok({ items: await getItems() });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "更新項目失敗");
  }
}
