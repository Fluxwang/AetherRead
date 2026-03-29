import { NextRequest, NextResponse } from 'next/server';
import { ArticleWorkflowError, fetchAndSummarizeArticle } from '@/lib/article-fetch';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await fetchAndSummarizeArticle(id);

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article content:', error);

    if (error instanceof ArticleWorkflowError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: '处理文章抓取失败' },
      { status: 500 }
    );
  }
}
