// PATCH /api/articles/[id]/read - 标记文章已读/未读
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isRead } = body as { isRead?: unknown };

    if (typeof isRead !== "boolean") {
      return NextResponse.json(
        { error: "isRead 必须是布尔值" },
        { status: 400 }
      );
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
      select: {
        id: true,
        isRead: true,
        readAt: true,
      },
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error updating read status:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "更新已读状态失败" },
      { status: 500 }
    );
  }
}
