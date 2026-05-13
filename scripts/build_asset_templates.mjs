import fs from "node:fs/promises";
import path from "node:path";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs", "asset_templates_trial");

const startMonth = new Date("2025-01-31");
const summaryMonthCount = 48;

const categories = [
  { key: "資產-現金", type: "資產", category: "現金" },
  { key: "資產-外幣現金", type: "資產", category: "外幣現金" },
  { key: "資產-台股/ETF", type: "資產", category: "台股/ETF" },
  { key: "資產-美股/ETF", type: "資產", category: "美股/ETF" },
  { key: "資產-基金", type: "資產", category: "基金" },
  { key: "資產-保單/固定型", type: "資產", category: "保單/固定型" },
  { key: "資產-其他", type: "資產", category: "其他資產" },
  { key: "負債-信用卡應付", type: "負債", category: "信用卡應付" },
  { key: "負債-分期/借款", type: "負債", category: "分期/借款" },
  { key: "負債-保單借款", type: "負債", category: "保單借款" },
  { key: "負債-其他", type: "負債", category: "其他負債" },
];

const suggestedItems = [
  { item: "生活現金", categoryKey: "資產-現金", currency: "TWD", institution: "台新" },
  { item: "緊急預備金", categoryKey: "資產-現金", currency: "TWD", institution: "Richart" },
  { item: "數位存款", categoryKey: "資產-現金", currency: "TWD", institution: "王道" },
  { item: "美元現金", categoryKey: "資產-外幣現金", currency: "USD", institution: "玉山外幣" },
  { item: "台股ETF", categoryKey: "資產-台股/ETF", currency: "TWD", institution: "富邦證券" },
  { item: "美股ETF", categoryKey: "資產-美股/ETF", currency: "USD", institution: "Firstrade" },
  { item: "全球基金", categoryKey: "資產-基金", currency: "TWD", institution: "中租基金" },
  { item: "儲蓄險", categoryKey: "資產-保單/固定型", currency: "TWD", institution: "國泰人壽" },
  { item: "玉山信用卡", categoryKey: "負債-信用卡應付", currency: "TWD", institution: "玉山" },
  { item: "富邦信用卡", categoryKey: "負債-信用卡應付", currency: "TWD", institution: "富邦" },
  { item: "學貸", categoryKey: "負債-分期/借款", currency: "TWD", institution: "台灣銀行" },
  { item: "機車分期", categoryKey: "負債-分期/借款", currency: "TWD", institution: "和潤" },
  { item: "保單借款", categoryKey: "負債-保單借款", currency: "TWD", institution: "國泰人壽" },
];

const sampleMonths = [
  "2025-01-31",
  "2025-02-28",
  "2025-03-31",
  "2025-04-30",
  "2025-05-31",
  "2025-06-30",
  "2025-07-31",
  "2025-08-31",
  "2025-09-30",
  "2025-10-31",
];

const sampleNotes = {
  "2025-01-31": "基準月",
  "2025-03-31": "台股回檔，現金比重提高",
  "2025-05-31": "加碼美股ETF",
  "2025-10-31": "月底獎金入帳",
};

const assetSeries = {
  生活現金: [120000, 126000, 118000, 132000, 129000, 138000, 141000, 146000, 150000, 156000],
  緊急預備金: [200000, 200000, 205000, 205000, 205000, 210000, 210000, 210000, 212000, 215000],
  數位存款: [85000, 87000, 91000, 94000, 98000, 101000, 103000, 105000, 107000, 111000],
  美元現金: [8200, 8300, 8050, 7900, 8100, 8400, 8600, 8750, 8900, 9100],
  台股ETF: [320000, 329000, 315000, 337000, 345000, 352000, 361000, 368000, 374000, 381000],
  美股ETF: [9500, 9700, 9300, 9900, 10200, 10450, 10900, 11200, 11600, 11950],
  全球基金: [180000, 182000, 179000, 185000, 191000, 194000, 196000, 199000, 205000, 209000],
  儲蓄險: [260000, 260000, 260000, 261000, 261000, 262000, 262000, 263000, 263000, 264000],
};

const liabilitySeries = {
  玉山信用卡: [18000, 12000, 21000, 9000, 23000, 11000, 15000, 13000, 17000, 14000],
  富邦信用卡: [6000, 9000, 5000, 7000, 8000, 6000, 5000, 9000, 4000, 5000],
  學貸: [140000, 138000, 136000, 134000, 132000, 130000, 128000, 126000, 124000, 122000],
  機車分期: [24000, 22000, 20000, 18000, 16000, 14000, 12000, 10000, 8000, 6000],
  保單借款: [50000, 50000, 52000, 52000, 52000, 51000, 51000, 50000, 50000, 49000],
};

const usdRates = [31.2, 31.4, 31.8, 32.1, 32.0, 32.2, 32.4, 32.1, 31.9, 31.7];

const palette = {
  title: "Google Sheets 專用版",
  file: "asset_management_google_sheets_main.xlsx",
  accent: "#0F9D58",
  accentSoft: "#E6F4EA",
  accentAlt: "#1A73E8",
  accentWarm: "#F9AB00",
  text: "#202124",
  textSubtle: "#5F6368",
  border: "#DADCE0",
  background: "#FFFFFF",
  section: "#F8FBFF",
};

function col(index) {
  let value = index;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function a1(row, index) {
  return `${col(index)}${row}`;
}

function range(r1, c1, r2, c2) {
  return `${a1(r1, c1)}:${a1(r2, c2)}`;
}

function monthEndFormula(year, monthIndex) {
  return `=EOMONTH(DATE(${year},${monthIndex},1),0)`;
}

function sheetRef(name) {
  return `'${name}'`;
}

function sheetBaseFormatting(sheet) {
  sheet.showGridLines = true;
  sheet.getRange("A1:AZ220").format.font = { name: "Arial", size: 11, color: palette.text };
  sheet.getRange("A1:AZ220").format.verticalAlignment = "center";
}

function setWidths(sheet, entries) {
  for (const [ref, widthPx] of entries) {
    sheet.getRange(ref).format.columnWidthPx = widthPx;
  }
}

function buildSampleRecords() {
  const rows = [];
  for (let monthIndex = 0; monthIndex < sampleMonths.length; monthIndex += 1) {
    const month = sampleMonths[monthIndex];
    for (const item of suggestedItems) {
      const isAsset = item.categoryKey.startsWith("資產-");
      const series = isAsset ? assetSeries[item.item] : liabilitySeries[item.item];
      if (!series) continue;
      rows.push([
        new Date(month),
        "",
        "",
        item.categoryKey,
        item.item,
        item.institution,
        item.currency,
        series[monthIndex],
        item.currency === "USD" ? usdRates[monthIndex] : 1,
        "",
        sampleNotes[month] && (item.item === "生活現金" || item.item === "美股ETF") ? sampleNotes[month] : "",
      ]);
    }
  }
  return rows;
}

function buildIntroSheet(workbook) {
  const sheet = workbook.worksheets.add("使用說明");
  sheetBaseFormatting(sheet);
  setWidths(sheet, [["A:A", 120], ["B:B", 560]]);

  sheet.getRange("A1:B2").values = [
    ["Google Sheets 資產管理模板", ""],
    ["定位", "每月一次更新個人資產與負債，用條列式紀錄月結資料，並自動產生月度檢視與儀表板。"],
  ];
  sheet.getRange("A1:B1").format.font = { bold: true, size: 20, color: palette.text };
  sheet.getRange("A2:B2").format.font = { size: 10, color: palette.textSubtle };

  const rows = [
    ["1", "先看「主檔設定」：確認你要用的分類與常用項目。"],
    ["2", "每次月結只改「月結輸入」：每新增一筆資產或負債，就新增一列。"],
    ["3", "「分類代碼」欄有下拉選單：選完後會自動帶出「類型」與「大分類」。"],
    ["4", "台幣資產：匯率填 1。美元資產：填月底 USD/TWD 匯率。"],
    ["5", "如果不想分太細，直接用大分類即可，例如只記一列「資產-現金」。"],
    ["6", "如果想保留明細，再在「項目名稱」或「機構/帳戶」補細節。"],
    ["7", "「月度檢視」與「Dashboard」會自動依整張輸入表彙總，不需要手動複製公式。"],
  ];
  sheet.getRange("A5:B5").values = [["操作順序", "說明"]];
  sheet.getRange("A5:B5").format = {
    fill: palette.accent,
    font: { bold: true, color: "#FFFFFF" },
    borders: { preset: "outside", style: "thin", color: palette.accent },
  };
  sheet.getRange("A6:B12").values = rows;
  sheet.getRange("A5:B12").format.borders = { preset: "inside", style: "thin", color: palette.border };
}

function buildMasterSheet(workbook) {
  const sheet = workbook.worksheets.add("主檔設定");
  sheetBaseFormatting(sheet);
  setWidths(sheet, [
    ["A:A", 150],
    ["B:B", 80],
    ["C:C", 120],
    ["D:D", 160],
    ["F:F", 140],
    ["G:G", 160],
    ["H:H", 80],
    ["I:I", 120],
  ]);

  sheet.getRange("A1:I2").values = [
    ["主檔設定", "", "", "", "", "", "", "", ""],
    ["這裡放分類與常用項目。月結輸入建議用這裡的分類代碼下拉選單，不用每次手打。", "", "", "", "", "", "", ""],
  ];
  sheet.getRange("A1:I1").format.font = { bold: true, size: 18, color: palette.text };
  sheet.getRange("A2:I2").format.font = { size: 10, color: palette.textSubtle };

  sheet.getRange("A4:D4").values = [["分類代碼", "類型", "大分類", "說明"]];
  sheet.getRange("A4:D4").format = {
    fill: palette.accentSoft,
    font: { bold: true, color: palette.text },
    borders: { preset: "outside", style: "thin", color: palette.border },
  };
  sheet.getRange("A5:D15").values = categories.map((row) => [row.key, row.type, row.category, ""]);

  sheet.getRange("F4:I4").values = [["常用項目", "預設分類代碼", "預設幣別", "預設機構/帳戶"]];
  sheet.getRange("F4:I4").format = {
    fill: palette.accentSoft,
    font: { bold: true, color: palette.text },
    borders: { preset: "outside", style: "thin", color: palette.border },
  };
  sheet.getRange("F5:I17").values = suggestedItems.map((row) => [
    row.item,
    row.categoryKey,
    row.currency,
    row.institution,
  ]);

  sheet.getRange("A4:D15").format.borders = { preset: "inside", style: "thin", color: palette.border };
  sheet.getRange("F4:I17").format.borders = { preset: "inside", style: "thin", color: palette.border };
}

function buildInputSheet(workbook) {
  const sheet = workbook.worksheets.add("月結輸入");
  sheetBaseFormatting(sheet);
  setWidths(sheet, [
    ["A:A", 110],
    ["B:B", 150],
    ["C:C", 90],
    ["D:D", 120],
    ["E:E", 160],
    ["F:F", 140],
    ["G:G", 90],
    ["H:I", 110],
    ["J:J", 120],
    ["K:K", 260],
  ]);

  sheet.getRange("A1:K3").values = [
    ["月結輸入", "", "", "", "", "", "", "", "", "", ""],
    ["新增一筆資料就新增一列。選擇分類代碼後，類型與大分類會自動帶出。", "", "", "", "", "", "", "", "", "", ""],
    ["建議最少填：月份、分類代碼、項目名稱、幣別、原幣金額。", "", "", "", "", "", "", "", "", "", ""],
  ];
  sheet.getRange("A1:K1").format.font = { bold: true, size: 18, color: palette.text };
  sheet.getRange("A2:K3").format.font = { size: 10, color: palette.textSubtle };

  const headers = [
    "month_end",
    "類型",
    "分類",
    "分類代碼",
    "項目名稱",
    "機構/帳戶",
    "幣別",
    "原幣金額",
    "匯率",
    "台幣金額",
    "備註",
  ];
  sheet.getRange("A5:K5").values = [headers];
  sheet.getRange("A5:K5").format = {
    fill: palette.accent,
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: palette.accent },
  };

  const inputStart = 6;
  const inputEnd = 155;
  sheet.getRange(`A${inputStart}:K${inputEnd}`).format.borders = { preset: "inside", style: "thin", color: palette.border };
  sheet.getRange(`A${inputStart}:A${inputEnd}`).format.numberFormat = "yyyy-mm-dd";
  sheet.getRange(`H${inputStart}:J${inputEnd}`).format.numberFormat = "#,##0.00";
  sheet.getRange(`I${inputStart}:I${inputEnd}`).format.numberFormat = "0.00";

  const sampleMatrix = buildSampleRecords();
  sheet.getRange(`A${inputStart}:K${inputStart + sampleMatrix.length - 1}`).values = sampleMatrix;

  const typeFormulas = [];
  const categoryFormulas = [];
  const twdFormulas = [];
  for (let row = inputStart; row <= inputEnd; row += 1) {
    typeFormulas.push([`=IFERROR(VLOOKUP($D${row},${sheetRef("主檔設定")}!$A:$C,2,FALSE),"")`]);
    categoryFormulas.push([`=IFERROR(VLOOKUP($D${row},${sheetRef("主檔設定")}!$A:$C,3,FALSE),"")`]);
    twdFormulas.push([`=IF($H${row}="","",IF($G${row}="USD",IF($I${row}="","",ROUND($H${row}*$I${row},0)),ROUND($H${row},0)))`]);
  }
  sheet.getRange(`B${inputStart}:B${inputEnd}`).formulas = typeFormulas;
  sheet.getRange(`C${inputStart}:C${inputEnd}`).formulas = categoryFormulas;
  sheet.getRange(`J${inputStart}:J${inputEnd}`).formulas = twdFormulas;
  sheet.getRange(`B${inputStart}:C${inputEnd}`).format.fill = palette.section;
  sheet.getRange(`J${inputStart}:J${inputEnd}`).format.fill = palette.section;

  sheet.getRange(`D${inputStart}:D${inputEnd}`).dataValidation = {
    allowBlank: true,
    list: { inCellDropDown: true, source: categories.map((x) => x.key) },
  };
  sheet.getRange(`E${inputStart}:E${inputEnd}`).dataValidation = {
    allowBlank: true,
    list: { inCellDropDown: true, source: suggestedItems.map((x) => x.item) },
  };
  sheet.getRange(`G${inputStart}:G${inputEnd}`).dataValidation = {
    allowBlank: true,
    list: { inCellDropDown: true, source: ["TWD", "USD"] },
  };
  sheet.getRange(`A${inputStart}:A${inputEnd}`).dataValidation = {
    allowBlank: true,
    rule: {
      type: "date",
      operator: "between",
      formula1: "=DATE(2025,1,1)",
      formula2: "=DATE(2030,12,31)",
    },
  };

  sheet.freezePanes.freezeRows(5);
}

function summaryMonths() {
  const list = [];
  for (let i = 0; i < summaryMonthCount; i += 1) {
    const month = new Date(startMonth.getFullYear(), startMonth.getMonth() + i + 1, 0);
    list.push(month);
  }
  return list;
}

function buildMonthlyViewSheet(workbook) {
  const sheet = workbook.worksheets.add("月度檢視");
  sheetBaseFormatting(sheet);
  setWidths(sheet, [["A:A", 80], ["B:B", 150], [`C:AX`, 86]]);

  sheet.getRange("A1:K2").values = [
    ["月度檢視", "", "", "", "", "", "", "", "", "", ""],
    ["依月份彙總總資產、總負債、淨資產與各大分類。這張表不需要手動編輯。", "", "", "", "", "", "", "", "", "", ""],
  ];
  sheet.getRange("A1:K1").format.font = { bold: true, size: 18, color: palette.text };
  sheet.getRange("A2:K2").format.font = { size: 10, color: palette.textSubtle };

  const months = summaryMonths();
  sheet.getRange("A4:B4").values = [["類型", "分類"]];
  sheet.getRange(range(4, 3, 4, 2 + summaryMonthCount)).format = {
    fill: palette.accent,
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: palette.accent },
  };
  sheet.getRange("A4:B4").format = {
    fill: palette.accent,
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: palette.accent },
  };

  months.forEach((month, index) => {
    const row = 4;
    const colIdx = 3 + index;
    sheet.getRange(a1(row, colIdx)).formulas = [[monthEndFormula(month.getFullYear(), month.getMonth() + 1)]];
  });
  sheet.getRange(range(4, 3, 4, 2 + summaryMonthCount)).format.numberFormat = "yyyy-mm";

  const rows = [
    ["資產", "現金"],
    ["資產", "外幣現金"],
    ["資產", "台股/ETF"],
    ["資產", "美股/ETF"],
    ["資產", "基金"],
    ["資產", "保單/固定型"],
    ["資產", "其他資產"],
    ["資產", "總資產"],
    ["負債", "信用卡應付"],
    ["負債", "分期/借款"],
    ["負債", "保單借款"],
    ["負債", "其他負債"],
    ["負債", "總負債"],
    ["總覽", "淨資產"],
  ];
  const startRow = 5;
  sheet.getRange(`A${startRow}:B${startRow + rows.length - 1}`).values = rows;
  sheet.getRange(`A${startRow}:B${startRow + rows.length - 1}`).format.borders = {
    preset: "inside",
    style: "thin",
    color: palette.border,
  };

  for (let r = 0; r < rows.length; r += 1) {
    const sheetRow = startRow + r;
    for (let m = 0; m < summaryMonthCount; m += 1) {
      const colIdx = 3 + m;
      const type = rows[r][0];
      const category = rows[r][1];
      let formula = "";
      if (type === "資產" && category !== "總資產") {
        formula = `=IF(COUNTIFS(${sheetRef("月結輸入")}!$A:$A,${a1(4, colIdx)},${sheetRef("月結輸入")}!$B:$B,"資產",${sheetRef("月結輸入")}!$C:$C,$B${sheetRow})=0,"",SUMIFS(${sheetRef("月結輸入")}!$J:$J,${sheetRef("月結輸入")}!$A:$A,${a1(4, colIdx)},${sheetRef("月結輸入")}!$B:$B,"資產",${sheetRef("月結輸入")}!$C:$C,$B${sheetRow}))`;
      } else if (type === "資產" && category === "總資產") {
        formula = `=IF(COUNT(${a1(5, colIdx)}:${a1(11, colIdx)})=0,"",SUM(${a1(5, colIdx)}:${a1(11, colIdx)}))`;
      } else if (type === "負債" && category !== "總負債") {
        formula = `=IF(COUNTIFS(${sheetRef("月結輸入")}!$A:$A,${a1(4, colIdx)},${sheetRef("月結輸入")}!$B:$B,"負債",${sheetRef("月結輸入")}!$C:$C,$B${sheetRow})=0,"",SUMIFS(${sheetRef("月結輸入")}!$J:$J,${sheetRef("月結輸入")}!$A:$A,${a1(4, colIdx)},${sheetRef("月結輸入")}!$B:$B,"負債",${sheetRef("月結輸入")}!$C:$C,$B${sheetRow}))`;
      } else if (type === "負債" && category === "總負債") {
        formula = `=IF(COUNT(${a1(13, colIdx)}:${a1(16, colIdx)})=0,"",SUM(${a1(13, colIdx)}:${a1(16, colIdx)}))`;
      } else {
        formula = `=IF(OR(${a1(12, colIdx)}="",${a1(17, colIdx)}=""),"",${a1(12, colIdx)}-${a1(17, colIdx)})`;
      }
      sheet.getRange(a1(sheetRow, colIdx)).formulas = [[formula]];
    }
  }
  sheet.getRange(range(5, 3, 18, 2 + summaryMonthCount)).format.numberFormat = "#,##0";
  sheet.getRange(range(12, 1, 12, 2 + summaryMonthCount)).format.fill = palette.section;
  sheet.getRange(range(17, 1, 17, 2 + summaryMonthCount)).format.fill = palette.section;
  sheet.getRange(range(18, 1, 18, 2 + summaryMonthCount)).format.fill = palette.accentSoft;
  sheet.freezePanes.freezeRows(4);
  sheet.freezePanes.freezeColumns(2);

  return { months, startRow };
}

function buildDashboardSheet(workbook) {
  const sheet = workbook.worksheets.add("Dashboard");
  sheetBaseFormatting(sheet);
  setWidths(sheet, [
    ["A:A", 90],
    ["B:B", 110],
    ["C:C", 110],
    ["D:D", 110],
    ["E:E", 30],
    ["F:F", 120],
    ["G:G", 120],
    ["H:H", 120],
    ["I:I", 30],
    ["J:J", 120],
    ["K:K", 120],
    ["L:L", 120],
  ]);

  sheet.getRange("A1:L2").values = [
    ["Google Sheets 資產負債 Dashboard", "", "", "", "", "", "", "", "", "", "", ""],
    ["使用條列式月結輸入，自動整理成淨資產趨勢與配置檢視。", "", "", "", "", "", "", "", "", "", "", ""],
  ];
  sheet.getRange("A1:L1").format.font = { bold: true, size: 19, color: palette.text };
  sheet.getRange("A2:L2").format.font = { size: 10, color: palette.textSubtle };

  sheet.getRange("M2").formulas = [[`=MAX(${sheetRef("月結輸入")}!A6:A155)`]];
  sheet.getRange("M3").formulas = [[`=EOMONTH(M2,-1)`]];

  sheet.getRange("A4:B5").format = {
    fill: palette.background,
    borders: { preset: "outside", style: "thin", color: palette.border },
  };
  sheet.getRange("A4").values = [["最新月份"]];
  sheet.getRange("B4").formulas = [[`=IF($M$2=0,"",$M$2)`]];
  sheet.getRange("B4").format.numberFormat = "yyyy-mm";
  sheet.getRange("A4").format.font = { bold: true, color: palette.textSubtle };
  sheet.getRange("B4").format.font = { bold: true, size: 12, color: palette.text };

  const kpis = [
    ["總資產", `=IF($M$2=0,"",SUMIFS(${sheetRef("月結輸入")}!$J:$J,${sheetRef("月結輸入")}!$A:$A,$M$2,${sheetRef("月結輸入")}!$B:$B,"資產"))`, 1, false],
    ["總負債", `=IF($M$2=0,"",SUMIFS(${sheetRef("月結輸入")}!$J:$J,${sheetRef("月結輸入")}!$A:$A,$M$2,${sheetRef("月結輸入")}!$B:$B,"負債"))`, 3, true],
    ["淨資產", `=IF(OR(A8="",C8=""),"",A8-C8)`, 6, false],
    ["月增減", `=IF($M$3=0,"",(SUMIFS(${sheetRef("月結輸入")}!$J:$J,${sheetRef("月結輸入")}!$A:$A,$M$2,${sheetRef("月結輸入")}!$B:$B,"資產")-SUMIFS(${sheetRef("月結輸入")}!$J:$J,${sheetRef("月結輸入")}!$A:$A,$M$2,${sheetRef("月結輸入")}!$B:$B,"負債"))-(SUMIFS(${sheetRef("月結輸入")}!$J:$J,${sheetRef("月結輸入")}!$A:$A,$M$3,${sheetRef("月結輸入")}!$B:$B,"資產")-SUMIFS(${sheetRef("月結輸入")}!$J:$J,${sheetRef("月結輸入")}!$A:$A,$M$3,${sheetRef("月結輸入")}!$B:$B,"負債")))`, 8, true],
  ];

  for (const [label, formula, colStart, warm] of kpis) {
    sheet.getRange(range(7, colStart, 8, colStart + 1)).format = {
      fill: warm ? palette.section : palette.accentSoft,
      borders: { preset: "outside", style: "thin", color: palette.border },
    };
    sheet.getRange(a1(7, colStart)).values = [[label]];
    sheet.getRange(a1(7, colStart)).format.font = { bold: true, size: 10, color: palette.textSubtle };
    sheet.getRange(a1(8, colStart)).formulas = [[formula]];
    sheet.getRange(a1(8, colStart)).format.font = { bold: true, size: 16, color: palette.text };
    sheet.getRange(a1(8, colStart)).format.numberFormat = "#,##0";
  }

  sheet.getRange("A12:D29").format = { fill: palette.background, borders: { preset: "outside", style: "thin", color: palette.border } };
  sheet.getRange("F12:I29").format = { fill: palette.background, borders: { preset: "outside", style: "thin", color: palette.border } };
  sheet.getRange("J12:L29").format = { fill: palette.background, borders: { preset: "outside", style: "thin", color: palette.border } };
  sheet.getRange("A12").values = [["淨資產趨勢"]];
  sheet.getRange("F12").values = [["資產配置"]];
  sheet.getRange("J12").values = [["負債結構"]];
  sheet.getRange("A12").format.font = { bold: true, size: 12, color: palette.text };
  sheet.getRange("F12").format.font = { bold: true, size: 12, color: palette.text };
  sheet.getRange("J12").format.font = { bold: true, size: 12, color: palette.text };

  sheet.getRange("A34:D34").values = [["月份", "總資產", "總負債", "淨資產"]];
  sheet.getRange("A34:D34").format = { fill: palette.accent, font: { bold: true, color: "#FFFFFF" } };
  for (let i = 0; i < summaryMonthCount; i += 1) {
    const row = 35 + i;
    const sourceCol = col(3 + i);
    sheet.getRange(`A${row}`).formulas = [[`=IF(${sheetRef("月度檢視")}!${sourceCol}$18="","",${sheetRef("月度檢視")}!${sourceCol}$4)`]];
    sheet.getRange(`B${row}`).formulas = [[`=IF(${sheetRef("月度檢視")}!${sourceCol}$12="","",${sheetRef("月度檢視")}!${sourceCol}$12)`]];
    sheet.getRange(`C${row}`).formulas = [[`=IF(${sheetRef("月度檢視")}!${sourceCol}$17="","",${sheetRef("月度檢視")}!${sourceCol}$17)`]];
    sheet.getRange(`D${row}`).formulas = [[`=IF(${sheetRef("月度檢視")}!${sourceCol}$18="","",${sheetRef("月度檢視")}!${sourceCol}$18)`]];
  }
  sheet.getRange("A35:A82").format.numberFormat = "yyyy-mm";
  sheet.getRange("B35:D82").format.numberFormat = "#,##0";
  sheet.getRange("A34:D82").format.borders = { preset: "inside", style: "thin", color: palette.border };

  const assetBreakdown = [
    ["現金", 5],
    ["外幣現金", 6],
    ["台股/ETF", 7],
    ["美股/ETF", 8],
    ["基金", 9],
    ["保單/固定型", 10],
    ["其他資產", 11],
  ];
  sheet.getRange("F34:G41").values = [["資產分類", "金額"], ...assetBreakdown.map(([name]) => [name, null])];
  assetBreakdown.forEach((_, idx) => {
    const row = 35 + idx;
    sheet.getRange(`G${row}`).formulas = [[`=IF($M$2=0,"",SUMIFS(${sheetRef("月結輸入")}!$J:$J,${sheetRef("月結輸入")}!$A:$A,$M$2,${sheetRef("月結輸入")}!$B:$B,"資產",${sheetRef("月結輸入")}!$C:$C,F${row}))`]];
  });
  sheet.getRange("F34:G41").format.borders = { preset: "inside", style: "thin", color: palette.border };
  sheet.getRange("F34:G34").format = { fill: palette.accentAlt, font: { bold: true, color: "#FFFFFF" } };
  sheet.getRange("G35:G41").format.numberFormat = "#,##0";

  const liabilityBreakdown = [
    ["信用卡應付", 13],
    ["分期/借款", 14],
    ["保單借款", 15],
    ["其他負債", 16],
  ];
  sheet.getRange("J34:K38").values = [["負債分類", "金額"], ...liabilityBreakdown.map(([name]) => [name, null])];
  liabilityBreakdown.forEach((_, idx) => {
    const row = 35 + idx;
    sheet.getRange(`K${row}`).formulas = [[`=IF($M$2=0,"",SUMIFS(${sheetRef("月結輸入")}!$J:$J,${sheetRef("月結輸入")}!$A:$A,$M$2,${sheetRef("月結輸入")}!$B:$B,"負債",${sheetRef("月結輸入")}!$C:$C,J${row}))`]];
  });
  sheet.getRange("J34:K38").format.borders = { preset: "inside", style: "thin", color: palette.border };
  sheet.getRange("J34:K34").format = { fill: palette.accentWarm, font: { bold: true, color: "#FFFFFF" } };
  sheet.getRange("K35:K38").format.numberFormat = "#,##0";

  const trendChart = sheet.charts.add("Line", sheet.getRange("A34:D82"), "Auto");
  trendChart.title = "淨資產、總資產與總負債";
  trendChart.setPosition(sheet.getRange("A13:D28"));
  trendChart.width = 520;
  trendChart.height = 280;
  trendChart.hasLegend = true;
  trendChart.legend = { position: "bottom", textStyle: { fontSize: 10 } };

  const assetChart = sheet.charts.add("Doughnut", sheet.getRange("F34:G41"), "Auto");
  assetChart.title = "資產配置";
  assetChart.setPosition(sheet.getRange("F13:I28"));
  assetChart.width = 360;
  assetChart.height = 280;
  assetChart.hasLegend = true;
  assetChart.legend = { position: "right", textStyle: { fontSize: 10 } };

  const liabilityChart = sheet.charts.add("Doughnut", sheet.getRange("J34:K38"), "Auto");
  liabilityChart.title = "負債結構";
  liabilityChart.setPosition(sheet.getRange("J13:L28"));
  liabilityChart.width = 300;
  liabilityChart.height = 260;
  liabilityChart.hasLegend = true;
  liabilityChart.legend = { position: "bottom", textStyle: { fontSize: 10 } };
}

function buildNotesSheet(workbook) {
  const sheet = workbook.worksheets.add("月結備註");
  sheetBaseFormatting(sheet);
  setWidths(sheet, [["A:A", 110], ["B:B", 420]]);
  sheet.getRange("A1:B2").values = [
    ["月結備註", ""],
    ["用途", "記錄當月重要變動，例如加碼投資、還款、獎金入帳、特殊消費。"],
  ];
  sheet.getRange("A1:B1").format.font = { bold: true, size: 18, color: palette.text };
  sheet.getRange("A2:B2").format.font = { size: 10, color: palette.textSubtle };
  sheet.getRange("A4:B4").values = [["月份", "備註"]];
  sheet.getRange("A4:B4").format = {
    fill: palette.accent,
    font: { bold: true, color: "#FFFFFF" },
    borders: { preset: "outside", style: "thin", color: palette.accent },
  };
  const notes = [
    [new Date("2025-01-31"), "建立資產管理模板基準月"],
    [new Date("2025-03-31"), "台股回檔，現金比重提高"],
    [new Date("2025-05-31"), "加碼美股ETF"],
    [new Date("2025-10-31"), "月底獎金入帳"],
  ];
  sheet.getRange(`A5:B${4 + notes.length}`).values = notes;
  sheet.getRange(`A5:A${4 + notes.length}`).format.numberFormat = "yyyy-mm-dd";
  sheet.getRange("A4:B28").format.borders = { preset: "inside", style: "thin", color: palette.border };
}

async function buildWorkbook() {
  const workbook = Workbook.create();
  buildIntroSheet(workbook);
  buildMasterSheet(workbook);
  buildInputSheet(workbook);
  buildMonthlyViewSheet(workbook);
  buildDashboardSheet(workbook);
  buildNotesSheet(workbook);

  await fs.mkdir(outputDir, { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  const outputPath = path.join(outputDir, palette.file);
  await output.save(outputPath);
  return outputPath;
}

const outputPath = await buildWorkbook();
console.log(JSON.stringify({ outputPath }, null, 2));
