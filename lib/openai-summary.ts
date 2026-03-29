// OpenAI Summary Generation
import { getOpenAIClient, normalizeOpenAIError } from '@/lib/openai-client';

const SUMMARY_MODEL = 'gpt-4o-mini';
const SUMMARY_SYSTEM_PROMPT =
  '你是一个专业的文章总结助手。请用中文总结英文文章的核心内容，控制在200字以内，突出文章的主要观点和关键信息。';

export async function generateSummary(content: string): Promise<string> {
  const openai = getOpenAIClient();

  try {
    const response = await openai.chat.completions.create({
      model: SUMMARY_MODEL,
      messages: [
        {
          role: 'system',
          content: SUMMARY_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `请总结以下文章：\n\n${content.slice(0, 4000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || '无法生成总结';
  } catch (error) {
    throw normalizeOpenAIError(error, '摘要生成');
  }
}
