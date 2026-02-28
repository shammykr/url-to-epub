export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { parseHTML } from "linkedom"; // Lighter and modern alternative to jsdom
import { Readability } from "@mozilla/readability";
import epub from "epub-gen-memory";
import sanitize from "sanitize-filename";

export async function GET() {
  return NextResponse.json({ status: "EPUB API is active" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 1. Fetch content with browser-like headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Target site returned ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. Parse HTML using linkedom instead of jsdom to avoid ESM errors
    const { document } = parseHTML(html);
    
    // 3. Extract content using Readability
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error("Could not extract readable content from this URL.");
    }

    const title = sanitize(article.title || "document").slice(0, 100);
    const author = article.byline || new URL(url).hostname;

    // 4. Generate EPUB in memory
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

    // 5. Upload to Vercel Blob
    const blob = await put(`${title}.epub`, epubBuffer, {
      access: "public",
      contentType: "application/epub+zip",
      addRandomSuffix: true,
    });

    return NextResponse.json({ downloadUrl: blob.url });

  } catch (error: any) {
    console.error("CONVERSION ERROR:", error.message);
    return NextResponse.json(
      { error: error.message || "An error occurred during EPUB generation" },
      { status: 500 }
    );
  }
}