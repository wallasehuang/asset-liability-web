import { PageIntro } from "@/components/page-intro";
import { SnapshotList } from "@/components/snapshots/snapshot-list";
import { getSnapshots } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SnapshotsPage() {
  const snapshots = await getSnapshots();

  return (
    <div className="grid gap-8">
      <PageIntro
        eyebrow="Workflow"
        title="月結列表"
        description="每個月只保留一份月結快照。你可以建立空白月份，或直接複製上月項目當作基礎，再在單月頁面集中儲存整份月結。"
      />
      <SnapshotList snapshots={snapshots} />
    </div>
  );
}
