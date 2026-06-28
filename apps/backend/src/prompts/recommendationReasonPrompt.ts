import type {
  FlavorProfile,
  SakeRecommendation,
} from "@sake-app/shared";

interface RecommendationReasonPromptInput {
  input: {
    sakeId: string;
    flavor: FlavorProfile;
  };
  recommendations: SakeRecommendation[];
}

export function buildRecommendationReasonPrompt(
  input: RecommendationReasonPromptInput,
): string {
  return [
    "あなたは日本酒の推薦理由を生成するアシスタントです。",
    "必ず与えられたJSONだけを根拠にしてください。",
    "存在しない情報を追加しないでください。",
    "日本酒度、酸度、精米歩合、価格、入手性など、入力に無い情報は書かないでください。",
    "推薦理由は1件あたり80〜120文字程度にしてください。",
    "flavorの各項目は、fruity=華やか、mellow=芳醇、rich=重厚、calm=穏やか、dry=ドライ、light=軽快として扱い、入力銘柄との差分をもとに説明してください。",
    "出力はJSON配列のみです。Markdownや説明文は不要です。",
    '配列要素は {"sakeId":"...","reason":"..."} の形式にしてください。',
    "入力JSON:",
    JSON.stringify(input),
  ].join("\n");
}
