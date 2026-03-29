// Jina Reader API Integration
// https://jina.ai/reader

export async function fetchArticleContent(url: string): Promise<string> {
  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const response = await fetch(jinaUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Jina Reader API failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Jina Reader returns markdown content
    return data.content || data.data?.content || "";
  } catch (error) {
    console.error("Error fetching article with Jina Reader:", error);
    throw error;
  }
}

export async function fetchArticleContentAsText(url: string): Promise<string> {
  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const response = await fetch(jinaUrl, {
      headers: {
        "Accept": "text/plain",
      },
    });

    if (!response.ok) {
      throw new Error(`Jina Reader API failed: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error("Error fetching article with Jina Reader:", error);
    throw error;
  }
}
