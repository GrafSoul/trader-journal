import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// ==================== AI DISCUSS PROXY (OpenRouter) ====================
function aiDiscussProxy() {
  let openrouterKey = ''
  const AI_MODEL = 'google/gemini-2.5-flash'
  const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

  return {
    name: 'ai-discuss-proxy',
    configureServer(server) {
      openrouterKey = process.env.OPENROUTER_API_KEY ?? loadEnv('development', process.cwd(), '').OPENROUTER_API_KEY ?? ''

      server.middlewares.use('/api/ai-discuss', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        if (!openrouterKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'OPENROUTER_API_KEY not configured. Add it to .env.local' }))
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
              articleText = html
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 8000)
            }
          } catch {
            // continue without article
          }
        }

        // Build system message
        const metaStr = context.meta
          ? Object.entries(context.meta).map(([k, v]) => `${k}: ${v}`).join('\n')
          : ''

        const systemMessage = `You are a senior financial analyst AI assistant in a Trader Journal desktop app.
The user wants to discuss a ${context.type === 'calendar' ? 'economic calendar event' : 'financial news article'}.

# Context
- **Title:** ${context.title}
- **Source:** ${context.source}
- **Description:** ${context.description}
${metaStr ? `- **Details:**\n${metaStr}` : ''}
${articleText ? `\n# Full article text\n${articleText}` : ''}

# Response rules
1. **Language:** Always respond in the same language the user writes in (Russian or English)
2. **Formatting:** ALWAYS use rich Markdown formatting in your responses:
   - Use **bold** for key terms, numbers, asset names, and important conclusions
   - Use bullet lists and numbered lists for structured information
   - Use headings (## or ###) to separate sections when the response is long
   - Use \`code\` for ticker symbols, currency pairs (e.g. \`EUR/USD\`, \`S&P 500\`)
   - Use > blockquotes for citing article text
   - Use --- separators between logical sections
3. **Content focus:**
   - Lead with the key takeaway in **bold**
   - Analyze market impact: which assets, sectors, currencies are affected
   - Provide actionable trading implications
   - When article text is available, reference and quote specific details
   - Include relevant context: historical precedents, related events
4. **Tone:** Professional, concise, data-driven. No fluff.`

        // OpenAI-compatible messages format
        const apiMessages = [
          { role: 'system', content: systemMessage },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ]

        try {
          const aiRes = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openrouterKey}`,
              'X-Title': 'Trader Journal',
            },
            body: JSON.stringify({
              model: AI_MODEL,
              messages: apiMessages,
              max_tokens: 2048,
              temperature: 0.7,
              stream: true,
            }),
          })

          if (!aiRes.ok) {
            const errText = await aiRes.text()
            res.statusCode = aiRes.status
            res.setHeader('Content-Type', 'text/event-stream')
            res.write(`data: ${JSON.stringify({ type: 'error', content: `OpenRouter ${aiRes.status}: ${errText}` })}\n\n`)
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

          const reader = aiRes.body?.getReader()
          if (!reader) {
            res.write(`data: ${JSON.stringify({ type: 'error', content: 'No stream' })}\n\n`)
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
                const text = event.choices?.[0]?.delta?.content
                if (text) {
                  res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
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
