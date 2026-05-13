import { getMasterData } from "@/lib/data";
import { ok } from "@/lib/http";

export async function GET() {
  return ok(await getMasterData());
}
