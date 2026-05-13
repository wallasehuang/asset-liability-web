import { snapshotCreateSchema } from "@/lib/schemas";
import { createSnapshot, getSnapshots } from "@/lib/data";
import { fail, ok, parseJson } from "@/lib/http";

export async function GET() {
  return ok({ snapshots: await getSnapshots() });
}

export async function POST(request: Request) {
  try {
    const input = snapshotCreateSchema.parse(await parseJson(request));
    const snapshot = await createSnapshot(input.month, input.sourceSnapshotId, input.note, input.usdFxRate);
    return ok({ snapshot });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "建立月結失敗");
  }
}
