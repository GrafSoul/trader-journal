import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

function remoteFeedProxy() {
  return {
    name: 'remote-feed-proxy',
    configureServer(server) {
      server.middlewares.use('/api/rss', async (req, res) => {
        const requestUrl = new URL(req.url ?? '', 'http://localhost')
        const target = requestUrl.searchParams.get('url')

        if (!target) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Missing url parameter' }))
          return
        }

        try {
          const response = await fetch(target, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; TraderJournal/1.0)',
              Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
            },
            redirect: 'follow',
          })

          if (!response.ok) {
            res.statusCode = response.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `HTTP ${response.status}` }))
            return
          }

          const text = await response.text()
          res.statusCode = 200
          res.setHeader('Content-Type', response.headers.get('content-type') ?? 'application/xml')
          res.setHeader('Cache-Control', 'no-store')
          res.end(text)
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'RSS proxy failed',
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), remoteFeedProxy()],
  server: {
    port: 3000,
    proxy: {
      '/api/ff-calendar/thisweek.json': {
        target: 'https://nfs.faireconomy.media',
        changeOrigin: true,
        rewrite: () => '/ff_calendar_thisweek.json',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TraderJournal/1.0)',
          Accept: 'application/json, text/plain, */*',
        },
      },
      '/api/ff-calendar/thisweek.xml': {
        target: 'https://nfs.faireconomy.media',
        changeOrigin: true,
        rewrite: () => '/ff_calendar_thisweek.xml',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TraderJournal/1.0)',
          Accept: 'application/xml, text/xml, */*',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
