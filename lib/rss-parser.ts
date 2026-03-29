// RSS Parser
import Parser from "rss-parser";

const parser = new Parser();

export interface RSSArticle {
  title: string;
  link: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
}

export async function parseRSSFeed(rssUrl: string): Promise<RSSArticle[]> {
  try {
    const feed = await parser.parseURL(rssUrl);

    return feed.items.map(item => ({
      title: item.title || "Untitled",
      link: item.link || "",
      content: item.content || item.contentSnippet || "",
      contentSnippet: item.contentSnippet,
      pubDate: item.pubDate,
    }));
  } catch (error) {
    console.error("Error parsing RSS feed:", error);
    throw error;
  }
}
