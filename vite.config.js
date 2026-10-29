import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { YoutubeTranscript } from 'youtube-transcript'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function multiPageRoutingPlugin() {
  return {
    name: 'multipage-routing-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '/'
        const [pathname, search] = rawUrl.split('?')
        const query = search ? `?${search}` : ''

        if (pathname === '/app' || pathname === '/app/') {
          req.url = `/app.html${query}`
        } else if (pathname === '/login' || pathname === '/login/') {
          req.url = `/login.html${query}`
        }
        next()
      });
    }
  };
}

function youtubeTranscriptPlugin() {
  return {
    name: 'youtube-transcript-plugin',
    configureServer(server) {
      server.middlewares.use('/api/yt-transcript', async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const videoId = url.searchParams.get('v');
        if (!videoId) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing video ID' }));
          return;
        }

        try {
          // Fetch real transcript using YoutubeTranscript
          let items = null;
          try {
            // 1. Try English track first
            items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
          } catch (e) {
            // 2. Fallback to default/available track
            try {
              items = await YoutubeTranscript.fetchTranscript(videoId);
            } catch (err) {
              console.warn(`[yt-transcript] No transcript found for ${videoId}:`, err.message);
            }
          }

          if (items && items.length > 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'success',
              videoId,
              items: items.map(item => ({
                text: item.text,
                duration: item.duration,
                offset: item.offset,
                lang: item.lang
              }))
            }));
            return;
          }

          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'No captions found for this video' }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      server.middlewares.use('/api/web-search', async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const query = url.searchParams.get('q');
        if (!query) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing query' }));
          return;
        }

        try {
          const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
          const ddgRes = await fetch(ddgUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });

          const results = [];
          if (ddgRes.ok) {
            const html = await ddgRes.text();
            const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
            let match;
            while ((match = regex.exec(html)) !== null && results.length < 5) {
              const snippet = match[1]
                .replace(/<[^>]+>/g, '')
                .replace(/&#x27;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/\s+/g, ' ')
                .trim();
              if (snippet) results.push(snippet);
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ query, results: results.join('\n\n') }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // Robust server-side PDF text extraction middleware
      server.middlewares.use('/api/parse-pdf', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
            const loadingTask = pdfjsLib.getDocument({
              data: new Uint8Array(buffer),
              useSystemFonts: true,
              isEvalSupported: false,
              disableFontFace: true
            });
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages || 1;
            const pageTexts = [];

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageStrings = textContent.items
                .map(item => item.str)
                .filter(s => s && s.trim().length > 0);
              if (pageStrings.length > 0) {
                pageTexts.push(`[Page ${pageNum}]\n` + pageStrings.join(' '));
              }
            }

            const fullText = pageTexts.join('\n\n').trim();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'success', numPages, text: fullText }));
          } catch (err) {
            console.warn('[parse-pdf error]:', err.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    youtubeTranscriptPlugin(),
    multiPageRoutingPlugin()
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
        login: resolve(__dirname, 'login.html')
      }
    }
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api/backend': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/backend/, '')
      }
    }
  }
})
