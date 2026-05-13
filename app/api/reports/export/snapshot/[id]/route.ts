import { exportSnapshotCsv } from "@/lib/data";
import { fail } from "@/lib/http";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const csv = await exportSnapshotCsv(id);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="snapshot-${id}.csv"`,
      },
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "匯出 CSV 失敗");
  }
}
