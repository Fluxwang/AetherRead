// GET /api/articles/[id] - 获取单个文章详情
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const OWNER_TAGS = ["Wang", "LYY"] as const;
type OwnerTag = (typeof OWNER_TAGS)[number];

function isOwnerTag(value: string | null): value is OwnerTag {
  return !!value && OWNER_TAGS.includes(value as OwnerTag);
}

export async function GET(
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

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "获取文章失败" },
      { status: 500 }
    );
  }
}

// PATCH /api/articles/[id] - 更新文章信息（当前支持 ownerTag）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const ownerTag = body?.ownerTag as string | null;

    if (!isOwnerTag(ownerTag)) {
      return NextResponse.json(
        { error: "无效的用户标签，仅支持 Wang 或 LYY" },
        { status: 400 }
      );
    }

    const article = await prisma.article.update({
      where: { id },
      data: { ownerTag },
      select: {
        id: true,
        ownerTag: true,
      },
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error updating article:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "更新文章失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[id] - 删除单个文章
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "删除文章失败" },
      { status: 500 }
    );
  }
}
