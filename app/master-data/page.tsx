import { MasterDataManager } from "@/components/forms/master-data-manager";
import { PageIntro } from "@/components/page-intro";
import { getMasterData } from "@/lib/data";

export default async function MasterDataPage() {
  const masterData = await getMasterData();

  return (
    <div className="grid gap-8">
      <PageIntro
        eyebrow="主檔"
        title="主檔管理"
        description="把分類與項目放回同一個管理畫面，左側維護分類群組，右側直接整理該分類底下的項目，讓新增、排序與啟停用都能在同一個流程完成。"
      />
      <MasterDataManager initialData={masterData} />
    </div>
  );
}
