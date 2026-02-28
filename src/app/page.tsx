'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  async function onGenerate() {
    setStatus('Generating…');
    setDownloadUrl('');

    try {
      const r = await fetch('/api/epub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        throw new Error(data?.error || `Failed (${r.status})`);
      }

      setDownloadUrl(data.downloadUrl);
      setStatus('Done ✅');
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: '48px auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>URL → EPUB</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Paste an article URL. We’ll generate an EPUB and give you a download link.
      </p>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          style={{
            flex: 1,
            padding: 12,
            fontSize: 16,
            border: '1px solid #ddd',
            borderRadius: 10,
          }}
        />
        <button
          onClick={onGenerate}
          style={{
            padding: '12px 16px',
            fontSize: 16,
            borderRadius: 10,
            border: '1px solid #ddd',
            cursor: 'pointer',
          }}
        >
          Generate
        </button>
      </div>

      <div style={{ marginTop: 12, minHeight: 24 }}>{status}</div>

      {downloadUrl && (
        <div style={{ marginTop: 12 }}>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 16, textDecoration: 'underline' }}
          >
            Download EPUB
          </a>
          <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
            Link opens the file stored in Vercel Blob.
          </div>
        </div>
      )}

      <div style={{ marginTop: 28, opacity: 0.7, fontSize: 13, lineHeight: 1.4 }}>
        Tip: This MVP extracts “reader mode” content. Some sites (heavy JS / paywalls) may fail without a
        headless browser.
      </div>
    </main>
  );
}