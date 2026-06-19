import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

interface ProxyPayload {
  url?: string
  method?: string
  headers?: Record<string, string>
  body?: unknown
}

function readRequestBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    req.on('data', chunk => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function localLLMProxyPlugin() {
  return {
    name: 'local-llm-proxy',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/api/llm-proxy', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const payload = JSON.parse(await readRequestBody(req)) as ProxyPayload

          if (!payload.url) {
            throw new Error('Missing target URL')
          }

          const target = new URL(payload.url)
          if (!['http:', 'https:'].includes(target.protocol)) {
            throw new Error('Only http and https URLs are allowed')
          }

          const headers = new Headers(payload.headers || {})
          const body = payload.body === undefined
            ? undefined
            : typeof payload.body === 'string'
              ? payload.body
              : JSON.stringify(payload.body)

          if (body && !headers.has('content-type')) {
            headers.set('content-type', 'application/json')
          }

          const upstream = await fetch(target, {
            method: payload.method || 'GET',
            headers,
            body,
          })

          res.statusCode = upstream.status
          res.setHeader('content-type', upstream.headers.get('content-type') || 'application/octet-stream')
          res.setHeader('cache-control', 'no-store')
          res.end(Buffer.from(await upstream.arrayBuffer()))
        } catch (error) {
          res.statusCode = 502
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Proxy request failed',
          }))
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localLLMProxyPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
