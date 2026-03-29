import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { splitParagraphs, translateParagraph } from '@/lib/openai-translate';
import type { BilingualParagraph } from '@/types';

export const runtime = 'nodejs';

function toSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function parseTranslatedText(translatedText: string | null, sourceParagraphs: string[]): BilingualParagraph[] {
  if (!translatedText?.trim()) {
    return sourceParagraphs.map((en) => ({ en, zh: '' }));
  }

  try {
    const parsed = JSON.parse(translatedText);
    if (!Array.isArray(parsed)) {
      return sourceParagraphs.map((en) => ({ en, zh: '' }));
    }

    return sourceParagraphs.map((en, idx) => {
      const row = parsed[idx];
      return {
        en,
        zh: typeof row?.zh === 'string' ? row.zh.trim() : '',
      };
    });
  } catch {
    return sourceParagraphs.map((en) => ({ en, zh: '' }));
  }
}

function getFirstUntranslatedIndex(pairs: BilingualParagraph[]): number {
  for (let i = 0; i < pairs.length; i += 1) {
    if (!pairs[i].zh) {
      return i;
    }
  }

  return pairs.length;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      originalContent: true,
      translatedText: true,
      translationStatus: true,
    },
  });

  if (!article) {
    return NextResponse.json(
      { error: '文章不存在' },
      { status: 404 }
    );
  }

  if (article.status !== 'ready') {
    return NextResponse.json(
      { error: '文章尚未抓取完成，暂不可翻译' },
      { status: 409 }
    );
  }

  if (!article.originalContent?.trim()) {
    return NextResponse.json(
      { error: '文章内容为空，无法翻译' },
      { status: 400 }
    );
  }

  const paragraphs = splitParagraphs(article.originalContent);
  if (paragraphs.length === 0) {
    return NextResponse.json(
      { error: '文章段落为空，无法翻译' },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        controller.close();
      };

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(toSSE(event, data)));
      };

      const keepAlive = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, 15000);

      try {
        const pairs = parseTranslatedText(article.translatedText, paragraphs);
        const total = pairs.length;
        const startIndex = getFirstUntranslatedIndex(pairs);

        send('start', {
          total,
          completed: startIndex,
          status: article.translationStatus,
        });

        for (let i = 0; i < startIndex; i += 1) {
          send('chunk', {
            index: i,
            total,
            pair: pairs[i],
            completed: i + 1,
            translatedText: JSON.stringify(pairs.slice(0, i + 1)),
          });
        }

        if (startIndex >= total) {
          const finalTranslatedText = JSON.stringify(pairs);
          await prisma.article.update({
            where: { id: article.id },
            data: {
              translatedText: finalTranslatedText,
              translationStatus: 'ready',
              translationError: null,
            },
          });

          send('done', {
            total,
            translatedText: finalTranslatedText,
          });
          return;
        }

        await prisma.article.update({
          where: { id: article.id },
          data: {
            translationStatus: 'processing',
            translationError: null,
          },
        });

        let aborted = false;

        for (let idx = startIndex; idx < total; idx += 1) {
          if (request.signal.aborted) {
            aborted = true;
            break;
          }

          const en = paragraphs[idx];
          const zh = await translateParagraph(en);
          pairs[idx] = { en, zh };
          const partialTranslatedText = JSON.stringify(pairs.slice(0, idx + 1));

          await prisma.article.update({
            where: { id: article.id },
            data: {
              translatedText: partialTranslatedText,
              translationStatus: 'processing',
              translationError: null,
            },
          });

          send('chunk', {
            index: idx,
            total,
            pair: pairs[idx],
            completed: idx + 1,
            translatedText: partialTranslatedText,
          });
        }

        if (aborted) {
          await prisma.article.update({
            where: { id: article.id },
            data: {
              translationStatus: 'not_started',
              translationError: null,
            },
          });

          send('aborted', {
            total,
            completed: getFirstUntranslatedIndex(pairs),
          });
          return;
        }

        const finalTranslatedText = JSON.stringify(pairs);
        await prisma.article.update({
          where: { id: article.id },
          data: {
            translatedText: finalTranslatedText,
            translationStatus: 'ready',
            translationError: null,
          },
        });

        send('done', {
          total,
          translatedText: finalTranslatedText,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '翻译失败';
        await prisma.article.update({
          where: { id: article.id },
          data: {
            translationStatus: 'failed',
            translationError: message,
          },
        });

        send('translate_error', { message });
      } finally {
        clearInterval(keepAlive);
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
