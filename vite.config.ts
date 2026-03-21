import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// ==================== AI DISCUSS PROXY ====================
function aiDiscussProxy() {
  let anthropicKey = ''

  return {
    name: 'ai-discuss-proxy',
    configureServer(server) {
      // Load API key from env (server-side only, never exposed to client)
      anthropicKey = process.env.ANTHROPIC_API_KEY ?? loadEnv('development', process.cwd(), '').ANTHROPIC_API_KEY ?? ''

      server.middlewares.use('/api/ai-discuss', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        if (!anthropicKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured. Add it to .env.local' }))
          return
        }

        // Read request body
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const body = JSON.parse(Buffer.concat(chunks).toString())

        const { context, messages, fetchArticle } = body

        // Optionally fetch article content
        let articleText = ''
        if (fetchArticle && context.url) {
          try {
            const articleRes = await fetch(context.url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TraderJournal/1.0)' },
              redirect: 'follow',
              signal: AbortSignal.timeout(10_000),
            })
            if (articleRes.ok) {
              const html = await articleRes.text()
              // Strip HTML tags, keep text content
              articleText = html
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 8000) // Limit to ~8K chars
            }
          } catch {
            // Article fetch failed, continue without it
          }
        }

        // Build system prompt
        const metaStr = context.meta
          ? Object.entries(context.meta).map(([k, v]) => `${k}: ${v}`).join('\n')
          : ''

        const systemPrompt = `You are a financial analyst AI assistant in a Trader Journal app.
The user wants to discuss a ${context.type === 'calendar' ? 'economic calendar event' : 'financial news article'}.

Context:
- Title: ${context.title}
- Source: ${context.source}
- Description: ${context.description}
${metaStr ? `- Details:\n${metaStr}` : ''}
${articleText ? `\nFull article text:\n${articleText}` : ''}

Instructions:
- Respond in the same language the user writes in (Russian or English)
- Be concise and professional
- Focus on market impact, trading implications, and actionable insights
- If the user asks about specific currency pairs or assets, provide relevant analysis
- When article text is available, reference specific details from it`

        try {
          const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-20250414',
              max_tokens: 2048,
              system: systemPrompt,
              messages: messages.map((m) => ({ role: m.role, content: m.content })),
              stream: true,
            }),
          })

          if (!claudeRes.ok) {
            const errText = await claudeRes.text()
            res.statusCode = claudeRes.status
            res.setHeader('Content-Type', 'text/event-stream')
            res.write(`data: ${JSON.stringify({ type: 'error', content: `Claude API: ${errText}` })}\n\n`)
            res.end()
            return
          }

          // Stream SSE response
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')

          if (articleText) {
            res.write(`data: ${JSON.stringify({ type: 'article', content: `Loaded ${articleText.length} chars from article` })}\n\n`)
          }

          const reader = claudeRes.body?.getReader()
          if (!reader) {
            res.write(`data: ${JSON.stringify({ type: 'error', content: 'No stream from Claude' })}\n\n`)
            res.end()
            return
          }

          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (!data || data === '[DONE]') continue

              try {
                const event = JSON.parse(data)
                if (event.type === 'content_block_delta' && event.delta?.text) {
                  res.write(`data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`)
                }
              } catch {
                // skip
              }
            }
          }

          res.write('data: [DONE]\n\n')
          res.end()
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'text/event-stream')
          res.write(`data: ${JSON.stringify({ type: 'error', content: error instanceof Error ? error.message : 'AI proxy failed' })}\n\n`)
          res.end()
        }
      })
    },
  }
}

// ==================== RSS FEED PROXY ====================
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
  plugins: [react(), tailwindcss(), remoteFeedProxy(), aiDiscussProxy()],
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
