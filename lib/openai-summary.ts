// OpenAI Summary Generation
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

export async function generateSummary(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "你是一个专业的文章总结助手。请用中文总结英文文章的核心内容，控制在200字以内，突出文章的主要观点和关键信息。",
        },
        {
          role: "user",
          content: `请总结以下文章：\n\n${content.slice(0, 4000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || "无法生成总结";
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}
