import { getNetWorthTrend } from "@/lib/data";
import { ok } from "@/lib/http";

export async function GET() {
  return ok({ trend: await getNetWorthTrend() });
}
