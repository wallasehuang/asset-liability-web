import { notFound } from "next/navigation";

import { PageIntro } from "@/components/page-intro";
import { SnapshotEditor } from "@/components/snapshots/snapshot-editor";
import { getSnapshotEditorData } from "@/lib/data";

export default async function SnapshotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSnapshotEditorData(id);

  if (!data.snapshot) {
    notFound();
  }

  const isReadonly = data.snapshot.status === "final";

  return (
    <div className="grid gap-8">
      <PageIntro
        eyebrow={isReadonly ? "Snapshot" : "Editor"}
        title={isReadonly ? "單月月結內容" : "單月月結編輯"}
        description={
          isReadonly
            ? "這份月結已完成定稿，目前僅提供內容檢視。若需要延續或修正資料，請從月結列表複製到新月份後再編輯。"
            : "草稿月份可自由調整內容、項目與匯率；一旦儲存為定稿，這份月結就會鎖定為唯讀內容。"
        }
      />
      <SnapshotEditor snapshot={data.snapshot} items={data.items} />
    </div>
  );
}
