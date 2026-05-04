export const CATEGORIES = [
  "旅費交通費", "消耗品費", "通信費", "会議費", "接待交際費",
  "外注費", "福利厚生費", "広告宣伝費", "事務用品費", "地代家賃", "その他経費",
] as const;

const RULES: { kw: string[]; cat: string }[] = [
  { kw: ["電車","バス","タクシー","乗車券","新幹線","電車代","交通","定期","鉄道","普通券","切符","モノレール"], cat: "旅費交通費" },
  { kw: ["宿泊","ホテル","旅館","出張","飛行機","航空"], cat: "旅費交通費" },
  { kw: ["自転車","修理","メンテナンス"], cat: "旅費交通費" },
  { kw: ["コピー","印刷","プリント","用紙","インク","トナー","文具","ボールペン","ノート","ガムテープ","電池","消耗品","カラーコピー","コピー代"], cat: "消耗品費" },
  { kw: ["生活用品","日用品","洗剤","掃除"], cat: "消耗品費" },
  { kw: ["水","ウォーター","飲料水"], cat: "消耗品費" },
  { kw: ["充電器","ケーブル","USB","周辺機器"], cat: "消耗品費" },
  { kw: ["電話","通信","インターネット","携帯","モバイル","Wi-Fi","回線","スマートフォン"], cat: "通信費" },
  { kw: ["会議","打ち合わせ","ミーティング","会場費","貸会議室"], cat: "会議費" },
  { kw: ["ランチ","昼食","夕食","食事","飲食","飲み会","接待","接客","会食","懇親会"], cat: "接待交際費" },
  { kw: ["外注","委託","フリーランス","業務委託"], cat: "外注費" },
  { kw: ["慶弔","お祝い","ギフト","プレゼント","福利","厚生"], cat: "福利厚生費" },
  { kw: ["広告","宣伝","チラシ","パンフ","PR"], cat: "広告宣伝費" },
  { kw: ["文房具","事務","ハンコ","スタンプ","事務用品"], cat: "事務用品費" },
  { kw: ["家賃","賃料","レンタル","駐車場"], cat: "地代家賃" },
];

function keywordCategorize(desc: string): { category: string; confidence: number } | null {
  const lower = desc.toLowerCase();
  for (const r of RULES) {
    if (r.kw.some((k) => lower.includes(k.toLowerCase()))) {
      return { category: r.cat, confidence: 0.85 };
    }
  }
  return null;
}

export async function categorizeExpense(
  description: string
): Promise<{ category: string; confidence: number; method: "ai" | "keyword" }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const hasKey = apiKey && apiKey !== "your_anthropic_api_key_here";

  if (hasKey) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: `品目名「${description}」に最も適した日本の勘定科目を1つ返してください。\n選択肢: ${CATEGORIES.join(", ")}\nJSON形式のみ: {"category": "勘定科目名", "confidence": 0.0-1.0}`,
        }],
      });
      const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
      const m = text.match(/\{[^}]+\}/);
      if (m) {
        const r = JSON.parse(m[0]);
        if ((CATEGORIES as readonly string[]).includes(r.category)) {
          return { ...r, method: "ai" };
        }
      }
    } catch (e) {
      console.error("Claude API error, falling back:", e);
    }
  }

  const kw = keywordCategorize(description);
  return kw ? { ...kw, method: "keyword" } : { category: "その他経費", confidence: 0.3, method: "keyword" };
}
