// POST /api/articles/process/[id] - 处理文章（爬取、总结、翻译）
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchArticleContentAsText } from "@/lib/jina-reader";
import { generateSummary } from "@/lib/openai-summary";
import { translateContent } from "@/lib/openai-translate";
import { parseRSSFeed } from "@/lib/rss-parser";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }

    await prisma.article.update({
      where: { id },
      data: { status: "processing" },
    });

    let content = article.originalContent;
    let title = article.title;

    if (article.originalUrl && !content) {
      try {
        if (article.sourceType === "rss") {
          const articles = await parseRSSFeed(article.originalUrl);
          if (articles.length > 0) {
            const firstArticle = articles[0];
            title = firstArticle.title;
            content = firstArticle.content || "";
            
            if (content.length < 500 && firstArticle.link) {
              content = await fetchArticleContentAsText(firstArticle.link);
            }
          }
        } else {
          content = await fetchArticleContentAsText(article.originalUrl);
          
          const firstLine = content.split("\n")[0];
          title = firstLine.length > 0 && firstLine.length < 100 
            ? firstLine 
            : content.slice(0, 50) + "...";
        }

        await prisma.article.update({
          where: { id },
          data: {
            title,
            originalContent: content,
          },
        });
      } catch (error) {
        console.error("Error fetching content:", error);
        await prisma.article.update({
          where: { id },
          data: { 
            status: "failed",
            summary: `爬取失败: ${error instanceof Error ? error.message : '未知错误'}`
          },
        });
        return NextResponse.json(
          { error: "爬取文章失败" },
          { status: 500 }
        );
      }
    }

    if (!content || content.length < 10) {
      await prisma.article.update({
        where: { id },
        data: { 
          status: "failed",
          summary: "无法获取文章内容"
        },
      });
      return NextResponse.json(
        { error: "文章内容为空" },
        { status: 400 }
      );
    }

    let summary = "";
    try {
      summary = await generateSummary(content);
    } catch (error) {
      console.error("Error generating summary:", error);
      summary = "无法生成摘要";
    }

    let translatedText = "";
    try {
      const bilingualParagraphs = await translateContent(content);
      translatedText = JSON.stringify(bilingualParagraphs);
    } catch (error) {
      console.error("Error translating content:", error);
      translatedText = JSON.stringify([]);
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        summary,
        translatedText,
        status: "ready",
      },
    });

    return NextResponse.json({ article: updatedArticle });
  } catch (error) {
    console.error("Error processing article:", error);
    
    const { id } = await params;
    await prisma.article.update({
      where: { id },
      data: { 
        status: "failed",
        summary: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      },
    });

    return NextResponse.json(
      { error: "处理文章失败" },
      { status: 500 }
    );
  }
}
