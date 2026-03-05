# URL → EPUB 📖

> Transform any web article into a clean, reader-ready EPUB file instantly.

---
<img width="1917" height="971" alt="image" src="https://github.com/user-attachments/assets/59bf8a3b-ae8f-4d9b-822b-9da15fdd63e1" />


## 🌟 Overview

**URL → EPUB** is a high-performance web utility designed to solve the "clutter" problem of modern web reading. By pasting a URL, the app extracts the core content—removing ads, popups, and sidebars—and packages it into a standard EPUB format compatible with Kindle, Apple Books, and Kobo.

**Why this exists?**

Most "Send to Kindle" tools struggle with modern web protections. This project was built to handle:

- **Bot Protection:** Bypasses `429 (Too Many Requests)` and `401 (Forbidden)` blocks from strict sites like Wikipedia and Reuters.
- **Serverless Compatibility:** Swaps heavy, legacy libraries like `jsdom` for `linkedom` to ensure 100% stability on Vercel's Node.js runtime.

---

## 🚀 Key Features

- **Smart Extraction:** Uses `@mozilla/readability` to identify the "heart" of an article.
- **Browser Mimicry:** Implements advanced headers to ensure high success rates across different domains.
- **In-Memory Generation:** Creates EPUBs entirely in RAM using `epub-gen-memory`, avoiding slow disk I/O and permission issues.
- **Vercel Blob Integration:** Seamlessly uploads generated files to the cloud for easy, one-click downloading.
- **URL Deduplication Cache:** SHA-256 hashes each URL to a deterministic Blob key — converting the same URL twice returns the cached file instantly.
- **Rate Limiting:** 5 requests per minute per IP via Upstash Redis middleware, protecting against abuse.
- **Conversion History:** The last 10 conversions are saved in the browser's `localStorage` with title, URL, and timestamp for easy re-downloading.

---

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| **Next.js 16** | React framework for the frontend and API routes. |
| **linkedom** | Lightweight DOM parser that avoids CommonJS/ESM conflict errors. |
| **Readability** | The engine behind Firefox's "Reader View" for content extraction. |
| **epub-gen-memory** | Fast, TypeScript-ready EPUB generator. |
| **Vercel Blob** | Scalable object storage for hosting the generated files. |
| **Tailwind CSS v4** | Utility-first CSS for a clean, responsive UI. |
| **Upstash Redis** | Serverless Redis for per-IP rate limiting via Next.js middleware. |

---

## ⚙️ Local Development

### 1. Prerequisites

- Node.js 18+
- A [Vercel Blob](https://vercel.com/storage/blob) store (for file storage)
- An [Upstash Redis](https://console.upstash.com) database (for rate limiting)

### 2. Installation

```bash
git clone https://github.com/your-username/url-to-epub.git
cd url-to-epub
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the project root:

```env
# Vercel Blob — create a store at vercel.com/storage/blob
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here

# Upstash Redis — create a database at console.upstash.com → REST API tab
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here
```

### 4. Start Developing

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 📱 Mobile Testing (Same Wi-Fi)

1. Find your local IP address (e.g., `192.168.1.15`).
2. Start the server bound to all interfaces:

```bash
npm run dev -- -H 0.0.0.0
```

3. Navigate to `http://192.168.1.15:3000` on your phone.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
