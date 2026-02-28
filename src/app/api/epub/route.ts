export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import EPub from 'epub-gen';
import sanitize from 'sanitize-filename';
import fs from 'fs';
import path from 'path';
import os from 'os';

function isValidHttpUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const url = body?.url;

    if (!url || !isValidHttpUrl(url)) {
      return NextResponse.json({ error: 'Please provide a valid http/https URL.' }, { status: 400 });
    }

    const r = await fetch(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
      },
    });

    if (!r.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (status ${r.status}).` },
        { status: 400 }
      );
    }

    const html = await r.text();

    // Extract readable content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article?.content) {
      return NextResponse.json(
        { error: 'Could not extract readable content from this URL.' },
        { status: 422 }
      );
    }

    const title = (sanitize(article.title || 'document') || 'document').slice(0, 120);
    const author = article.byline || new URL(url).hostname;

    // Generate epub to temp file
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'url2epub-'));
    const outPath = path.join(tmpDir, `${title}.epub`);

    await new EPub(
      {
        title,
        author,
        publisher: 'URL → EPUB',
        source: url,
        content: [{ title, data: article.content }],
      },
      outPath
    ).promise;

    const fileBuffer = fs.readFileSync(outPath);
    fs.rmSync(tmpDir, { recursive: true, force: true });

    // Upload to Vercel Blob and return a public link
    const blob = await put(`${title}.epub`, fileBuffer, {
      access: 'public',
      contentType: 'application/epub+zip',
      addRandomSuffix: true, // avoid collisions if same title
    });

    return NextResponse.json(
      { title, author, downloadUrl: blob.url },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error generating EPUB.' }, { status: 500 });
  }
}