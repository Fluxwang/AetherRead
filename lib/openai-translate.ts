// OpenAI Translation
import OpenAI from 'openai';
import { getOpenAIClient, normalizeOpenAIError } from '@/lib/openai-client';

const TRANSLATE_MODEL = 'gpt-4o-mini';
const TRANSLATE_SYSTEM_PROMPT =
  '你是一个专业的英译中翻译助手。请将英文段落翻译成中文，保持原文的语气和风格。每个段落前有编号[N]，请在翻译时保留编号格式。';
const TRANSLATE_SINGLE_SYSTEM_PROMPT =
  '你是一个专业的英译中翻译助手。请仅输出中文翻译结果，不要附加解释，不要保留英文原文。';
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

export async function translateParagraph(paragraph: string): Promise<string> {
  const openai = getOpenAIClient();

  try {
    const response = await openai.chat.completions.create({
      model: TRANSLATE_MODEL,
      messages: [
        {
          role: 'system',
          content: TRANSLATE_SINGLE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `请翻译以下英文段落，保留原有 Markdown 结构：\n\n${paragraph}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1200,
    });

    return response.choices[0]?.message?.content?.trim() || paragraph;
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

export function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\n+/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
}

function parseTranslatedParagraphs(translatedText: string, sourceLength: number): string[] {
  const result: string[] = [];
  const regex = /\[(\d+)\]\s*([\s\S]*?)(?=\n?\[\d+\]\s*|$)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(translatedText)) !== null) {
    const translatedIdx = Number.parseInt(match[1], 10) - 1;
    const translation = match[2]?.trim() || '';
    if (translatedIdx >= 0 && translatedIdx < sourceLength) {
      result[translatedIdx] = translation;
    }
  }

  return result;
}
