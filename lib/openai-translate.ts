// OpenAI Translation
import OpenAI from 'openai';
import { getOpenAIClient, normalizeOpenAIError } from '@/lib/openai-client';

const TRANSLATE_MODEL = 'gpt-4o-mini';
const TRANSLATE_SYSTEM_PROMPT =
  '你是一个专业的英译中翻译助手。请将英文段落翻译成中文，保持原文的语气和风格。每个段落前有编号[N]，请在翻译时保留编号格式。';
const BATCH_SIZE = 5;

export interface BilingualParagraph {
  en: string;
  zh: string;
}

export async function translateContent(content: string): Promise<BilingualParagraph[]> {
  const openai = getOpenAIClient();
  const paragraphs = splitParagraphs(content);
  const bilingualParagraphs: BilingualParagraph[] = [];

  try {
    // Translate in batches to avoid token limits
    for (let i = 0; i < paragraphs.length; i += BATCH_SIZE) {
      const batch = paragraphs.slice(i, i + BATCH_SIZE);
      const batchResult = await translateBatch(openai, batch);
      bilingualParagraphs.push(...batchResult);
    }

    return bilingualParagraphs;
  } catch (error) {
    throw normalizeOpenAIError(error, '翻译');
  }
}

async function translateBatch(openai: OpenAI, paragraphs: string[]): Promise<BilingualParagraph[]> {
  const numberedText = paragraphs.map((paragraph, idx) => `[${idx + 1}]\n${paragraph}`).join('\n\n');

  const response = await openai.chat.completions.create({
    model: TRANSLATE_MODEL,
    messages: [
      {
        role: 'system',
        content: TRANSLATE_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `请翻译以下段落：\n\n${numberedText}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 3000,
  });

  const translatedText = response.choices[0]?.message?.content || '';
  const translatedParagraphs = parseTranslatedParagraphs(translatedText, paragraphs.length);

  return paragraphs.map((en, idx) => ({
    en,
    zh: translatedParagraphs[idx] || en,
  }));
}

function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\n+/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
}

function parseTranslatedParagraphs(translatedText: string, sourceLength: number): string[] {
  return translatedText
    .split(/\[(\d+)\]/)
    .filter(chunk => chunk.trim())
    .reduce((acc, chunk, idx, arr) => {
      if (idx % 2 === 1) {
        const translatedIdx = Number.parseInt(chunk, 10) - 1;
        const translation = arr[idx + 1]?.trim() || '';
        if (translatedIdx >= 0 && translatedIdx < sourceLength) {
          acc[translatedIdx] = translation;
        }
      }
      return acc;
    }, [] as string[]);
}
