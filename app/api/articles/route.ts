// GET /api/articles - 获取所有文章列表
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        originalUrl: true,
        sourceType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "获取文章列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/articles - 创建新文章
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, content, sourceType } = body;

    if (!url && !content) {
      return NextResponse.json(
        { error: "必须提供 URL 或文章内容" },
        { status: 400 }
      );
    }

    // 创建文章记录
    const article = await prisma.article.create({
      data: {
        title: "处理中...",
        originalUrl: url || null,
        sourceType: sourceType || "manual",
        originalContent: content || "",
        status: "pending",
      },
    });

    // 返回文章ID，让客户端触发处理
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "创建文章失败" },
      { status: 500 }
    );
  }
}
