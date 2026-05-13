import { categorySchema } from "@/lib/schemas";
import { fail, ok, parseJson } from "@/lib/http";
import { getCategories } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = categorySchema.parse(await parseJson(request));
    await prisma.category.update({
      where: { id },
      data: input,
    });
    return ok({ categories: await getCategories() });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "更新分類失敗");
  }
}
