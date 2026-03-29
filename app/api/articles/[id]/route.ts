// GET /api/articles/[id] - 获取单个文章详情
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
