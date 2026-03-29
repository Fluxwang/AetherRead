// OpenAI Translation
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

export interface BilingualParagraph {
  en: string;
  zh: string;
}

export async function translateContent(content: string): Promise<BilingualParagraph[]> {
  try {
    // Split content into paragraphs
    const paragraphs = content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const bilingualParagraphs: BilingualParagraph[] = [];

    // Translate in batches to avoid token limits
    const batchSize = 5;
    for (let i = 0; i < paragraphs.length; i += batchSize) {
      const batch = paragraphs.slice(i, i + batchSize);
      const batchResult = await translateBatch(batch);
      bilingualParagraphs.push(...batchResult);
    }

    return bilingualParagraphs;
  } catch (error) {
    console.error("Error translating content:", error);
    throw error;
  }
}

async function translateBatch(paragraphs: string[]): Promise<BilingualParagraph[]> {
  const numberedText = paragraphs
    .map((p, idx) => `[${idx + 1}]\n${p}`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "你是一个专业的英译中翻译助手。请将英文段落翻译成中文，保持原文的语气和风格。每个段落前有编号[N]，请在翻译时保留编号格式。",
      },
      {
        role: "user",
        content: `请翻译以下段落：\n\n${numberedText}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 3000,
  });

  const translatedText = response.choices[0]?.message?.content || "";

  // Parse the translated text back into array
  const translatedParagraphs = translatedText
    .split(/\[(\d+)\]/)
    .filter(s => s.trim())
    .reduce((acc, curr, idx, arr) => {
      if (idx % 2 === 1) {
        const num = parseInt(curr) - 1;
        const translation = arr[idx + 1]?.trim() || "";
        if (num >= 0 && num < paragraphs.length) {
          acc[num] = translation;
        }
      }
      return acc;
    }, [] as string[]);

  return paragraphs.map((en, idx) => ({
    en,
    zh: translatedParagraphs[idx] || en,
  }));
}
