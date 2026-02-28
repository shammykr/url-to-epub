export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import epub from "epub-gen-memory";
import sanitize from "sanitize-filename";

/**
 * GET handler added to prevent 405 Method Not Allowed errors on Vercel 
 * caused by accidental GET redirects (e.g., trailing slash issues).
 */
export async function GET() {
  return NextResponse.json({ 
    message: "EPUB API is active. Please use a POST request to generate a file." 
  }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 1. Fetch content with full browser headers to avoid being blocked as a bot
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Target site returned ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. Extract "Reader Mode" content using Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error("Could not extract readable content from this URL.");
    }

    const title = sanitize(article.title || "document").slice(0, 100);
    const author = article.byline || new URL(url).hostname;

    // 3. Generate EPUB in memory
    // ignoreFailedDownloads: true is essential for sites that block image hotlinking (e.g. Wikipedia)
    const epubBuffer = await epub(
      { 
        title, 
        author,
        ignoreFailedDownloads: true 
      },
      [
        {
          title: article.title || undefined,
          content: article.content,
        },
      ]
    );

    // 4. Upload to Vercel Blob
    const blob = await put(`${title}.epub`, epubBuffer, {
      access: "public",
      contentType: "application/epub+zip",
      addRandomSuffix: true,
    });

    // 5. Return the key expected by the frontend
    return NextResponse.json({ downloadUrl: blob.url });

  } catch (error: any) {
    console.error("EPUB API ERROR:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during EPUB generation" },
      { status: 500 }
    );
  }
}