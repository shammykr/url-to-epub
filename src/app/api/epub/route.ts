export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import epub from "epub-gen-memory";
import sanitize from "sanitize-filename";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 1. Fetch content with a descriptive User-Agent to avoid 429 blocks
    const response = await fetch(url, {
      headers: {
        "User-Agent": "URL2EPUB/1.0 (https://yourdomain.com; contact@yourdomain.com) Bot/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // 2. Extract "Reader Mode" content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error("Could not extract readable content from this URL.");
    }

    const title = sanitize(article.title || "document").slice(0, 100);
    const author = article.byline || new URL(url).hostname;

    // 3. Generate EPUB in memory
    // ignoreFailedDownloads: true ensures that blocked images don't crash the generation
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

    // Return the key expected by your frontend
    return NextResponse.json({ downloadUrl: blob.url });

  } catch (error: any) {
    console.error("Conversion Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during conversion" },
      { status: 500 }
    );
  }
}