import { getCategoryBreakdown } from "@/lib/data";
import { fail, ok } from "@/lib/http";
import { reportBreakdownQuerySchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = reportBreakdownQuerySchema.parse({
      snapshotId: url.searchParams.get("snapshotId"),
    });
    return ok({ breakdown: await getCategoryBreakdown(query.snapshotId) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "讀取分類彙總失敗");
  }
}
