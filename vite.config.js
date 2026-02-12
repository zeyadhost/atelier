import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { pathToFileURL } from 'url'

function apiMiddleware() {
    return {
        name: 'api-middleware',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (!req.url.startsWith('/api/')) return next()

                const route = req.url.split('?')[0].replace(/^\//, '')
                const filePath = new URL(`./${route}.js`, import.meta.url).pathname

                if (req.method === 'OPTIONS') {
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
                    res.writeHead(200)
                    res.end()
                    return
                }

                let body = ''
                req.on('data', chunk => body += chunk)
                req.on('end', async () => {
                    try {
                        req.body = body ? JSON.parse(body) : {}
                        const mod = await import(pathToFileURL(filePath).href + '?t=' + Date.now())
                        const mockRes = {
                            statusCode: 200,
                            _headers: {},
                            setHeader(k, v) { this._headers[k] = v },
                            status(code) { this.statusCode = code; return this },
                            json(data) {
                                res.setHeader('Content-Type', 'application/json')
                                Object.entries(this._headers).forEach(([k, v]) => res.setHeader(k, v))
                                res.writeHead(this.statusCode)
                                res.end(JSON.stringify(data))
                            },
                            end() { res.writeHead(this.statusCode); res.end() }
                        }
                        await mod.default(req, mockRes)
                    } catch (e) {
                        res.setHeader('Content-Type', 'application/json')
                        res.writeHead(500)
                        res.end(JSON.stringify({ error: e.message }))
                    }
                })
            })
        }
    }
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    Object.assign(process.env, env)
    return {
        plugins: [react(), apiMiddleware()],
    }
})