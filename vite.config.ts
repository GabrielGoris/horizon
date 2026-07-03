import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage } from 'node:http'

type TwitchTokenResponse = {
  access_token: string
  expires_in: number
}

let igdbAccessToken = ''
let igdbTokenExpiresAt = 0

function createIgdbProxyPlugin(): Plugin {
  return {
    name: 'horizon-igdb-proxy',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      const clientId = env.IGDB_CLIENT_ID
      const clientSecret = env.IGDB_CLIENT_SECRET

      async function getAccessToken() {
        if (igdbAccessToken && Date.now() < igdbTokenExpiresAt) {
          return igdbAccessToken
        }

        if (!clientId || !clientSecret) {
          throw new Error('Configure IGDB_CLIENT_ID e IGDB_CLIENT_SECRET no .env.local.')
        }

        const response = await fetch('https://id.twitch.tv/oauth2/token', {
          method: 'POST',
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
          }),
        })

        if (!response.ok) {
          throw new Error('Nao foi possivel autenticar na IGDB.')
        }

        const data = (await response.json()) as TwitchTokenResponse

        igdbAccessToken = data.access_token
        igdbTokenExpiresAt = Date.now() + Math.max(0, data.expires_in - 60) * 1000

        return igdbAccessToken
      }

      function readBody(req: IncomingMessage) {
        return new Promise<string>((resolve, reject) => {
          const chunks: Buffer[] = []

          req.on('data', (chunk) => {
            chunks.push(Buffer.from(chunk))
          })

          req.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf8'))
          })

          req.on('error', reject)
        })
      }

      server.middlewares.use('/igdb-api', async (req, res) => {
        try {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }

          const endpoint = req.url?.replace(/^\//, '') || ''
          const token = await getAccessToken()
          const body = await readBody(req)
          const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
              'Client-ID': clientId,
              'Content-Type': 'text/plain',
            },
            body,
          })

          const content = await response.text()

          res.statusCode = response.status
          res.setHeader('Content-Type', response.headers.get('content-type') ?? 'application/json')
          res.end(content)
        } catch (error) {
          console.error(error)
          res.statusCode = 500
          res.end(error instanceof Error ? error.message : 'Erro ao consultar IGDB.')
        }
      })

      server.middlewares.use('/steam-api', async (req, res) => {
        try {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }

          const endpoint = req.url?.replace(/^\//, '') || ''
          const response = await fetch(`https://store.steampowered.com/${endpoint}`)
          const content = await response.text()

          res.statusCode = response.status
          res.setHeader('Content-Type', response.headers.get('content-type') ?? 'application/json')
          res.end(content)
        } catch (error) {
          console.error(error)
          res.statusCode = 500
          res.end(error instanceof Error ? error.message : 'Erro ao consultar Steam.')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), createIgdbProxyPlugin()],
})
