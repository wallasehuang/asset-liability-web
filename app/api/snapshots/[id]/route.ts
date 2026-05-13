import { snapshotUpdateSchema } from "@/lib/schemas";
import { deleteSnapshot, getSnapshotDetail, getSnapshots, updateSnapshot } from "@/lib/data";
import { fail, ok, parseJson } from "@/lib/http";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const snapshot = await getSnapshotDetail(id);
    if (!snapshot) return fail("找不到指定月結", 404);
    return ok({ snapshot });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "讀取月結失敗");
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = snapshotUpdateSchema.parse(await parseJson(request));
    await updateSnapshot(id, input);
    return ok({ snapshot: await getSnapshotDetail(id) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "更新月結失敗");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteSnapshot(id);
    return ok({ snapshots: await getSnapshots() });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "刪除月結失敗");
  }
}
