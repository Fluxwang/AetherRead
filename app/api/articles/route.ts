/**
 * GET /api/articles - 获取文章列表
 * 
 * Query Parameters:
 * - ownerTag: "Wang" | "LYY" - 按用户筛选
 * - read: "all" | "read" | "unread" - 按已读状态筛选
 * 
 * Response: { articles: Article[] }
 */

/**
 * POST /api/articles - 创建新文章
 * 
 * Request Body:
 * - url?: string - 文章URL（爬虫模式）
 * - content?: string - 文章内容（粘贴模式）
 * - sourceType: "crawler" | "manual" | "rss"
 * - ownerTag: "Wang" | "LYY"
 * 
 * Response: { article: Article }
 */
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OwnerTag, ReadFilter } from "@/types";
import { OWNER_TAGS } from "@/types";

function isOwnerTag(value: string | null): value is OwnerTag {
  return !!value && OWNER_TAGS.includes(value as OwnerTag);
}

function toReadFilter(value: string | null): ReadFilter {
  if (value === "read" || value === "unread") {
    return value;
  }
  return "all";
}

export async function GET(request: NextRequest) {
  try {
    const ownerTagParam = request.nextUrl.searchParams.get("ownerTag");
    const readFilter = toReadFilter(request.nextUrl.searchParams.get("read"));

    if (ownerTagParam && !isOwnerTag(ownerTagParam)) {
      return NextResponse.json(
        { error: "无效的用户标签，仅支持 Wang 或 LYY" },
        { status: 400 }
      );
    }

    const where: Prisma.ArticleWhereInput = {};
    if (ownerTagParam) {
      where.ownerTag = ownerTagParam;
    }
    if (readFilter === "read") {
      where.isRead = true;
    }
    if (readFilter === "unread") {
      where.isRead = false;
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        originalUrl: true,
        sourceType: true,
        ownerTag: true,
        isRead: true,
        readAt: true,
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
    const { url, content, sourceType, ownerTag } = body;

    if (!url && !content) {
      return NextResponse.json(
        { error: "必须提供 URL 或文章内容" },
        { status: 400 }
      );
    }
    if (!isOwnerTag(ownerTag)) {
      return NextResponse.json(
        { error: "必须选择用户标签（Wang 或 LYY）" },
        { status: 400 }
      );
    }

    // 创建文章记录
    const article = await prisma.article.create({
      data: {
        title: "处理中...",
        originalUrl: url || null,
        sourceType: sourceType || "manual",
        ownerTag,
        isRead: false,
        readAt: null,
        originalContent: content || "",
        translationStatus: "not_started",
        translationError: null,
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
