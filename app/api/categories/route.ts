import { categorySchema } from "@/lib/schemas";
import { fail, ok, parseJson } from "@/lib/http";
import { getCategories } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return ok({ categories: await getCategories() });
}

export async function POST(request: Request) {
  try {
    const input = categorySchema.parse(await parseJson(request));
    await prisma.category.create({ data: input });
    return ok({ categories: await getCategories() });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "建立分類失敗");
  }
}
