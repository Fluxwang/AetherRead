// PATCH /api/articles/[id]/read - 标记文章已读/未读
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/api-error-handler";

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
    return handlePrismaError(error, '更新已读状态失败');
  }
}
