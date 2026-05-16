#!/usr/bin/env node

import crypto from 'node:crypto'
import http from 'node:http'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { readLocalEnv, getEnv } from './lib/read-env.mjs'

const PORT = Number(process.env.X_OAUTH_CALLBACK_PORT || 8787)
const HOST = '127.0.0.1'
const REDIRECT_URI = process.env.X_OAUTH_REDIRECT_URI || `http://${HOST}:${PORT}/callback`
const TOKEN_PATH = '.x-oauth2-token.json'

function base64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest()
}

function openUrl(url) {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url]
  spawn(command, args, { detached: true, stdio: 'ignore' }).unref()
}

function html(message) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>VesselSurge X OAuth</title></head><body style="font-family: system-ui; padding: 32px; max-width: 720px"><h1>${message.title}</h1><p>${message.body}</p></body></html>`
}

const localEnv = readLocalEnv()
const clientId = getEnv('X_OAUTH2_CLIENT_ID', localEnv) || getEnv('X_CLIENT_ID', localEnv)
const clientSecret = getEnv('X_OAUTH2_CLIENT_SECRET', localEnv) || getEnv('X_CLIENT_SECRET', localEnv)

if (!clientId) {
  console.error('[x-oauth2] Missing X_OAUTH2_CLIENT_ID or X_CLIENT_ID in .env.local')
  process.exit(1)
}

const state = base64Url(crypto.randomBytes(32))
const codeVerifier = base64Url(crypto.randomBytes(64))
const codeChallenge = base64Url(sha256(codeVerifier))
const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access']

const authorizeParams = new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: REDIRECT_URI,
  scope: scopes.join(' '),
  state,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
})
const authorizeUrl = `https://twitter.com/i/oauth2/authorize?${authorizeParams.toString()}`

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${HOST}:${PORT}`)

  if (url.pathname !== '/callback') {
    response.writeHead(404)
    response.end('Not found')
    return
  }

  const error = url.searchParams.get('error')
  if (error) {
    response.writeHead(400, { 'content-type': 'text/html; charset=utf-8' })
    response.end(html({ title: 'X OAuth failed', body: `${error}: ${url.searchParams.get('error_description') || ''}` }))
    server.close()
    return
  }

  if (url.searchParams.get('state') !== state) {
    response.writeHead(400, { 'content-type': 'text/html; charset=utf-8' })
    response.end(html({ title: 'X OAuth blocked', body: 'State mismatch. Try running the authorization again.' }))
    server.close()
    return
  }

  const code = url.searchParams.get('code')
  if (!code) {
    response.writeHead(400, { 'content-type': 'text/html; charset=utf-8' })
    response.end(html({ title: 'X OAuth failed', body: 'Missing authorization code.' }))
    server.close()
    return
  }

  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  })
  const headers = { 'content-type': 'application/x-www-form-urlencoded' }

  if (clientSecret) {
    headers.authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
  }

  const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers,
    body,
  })
  const token = await tokenResponse.json().catch(() => ({}))

  if (!tokenResponse.ok) {
    response.writeHead(500, { 'content-type': 'text/html; charset=utf-8' })
    response.end(html({ title: 'X token exchange failed', body: `${tokenResponse.status}: ${JSON.stringify(token)}` }))
    console.error('[x-oauth2] Token exchange failed')
    console.error(JSON.stringify({ status: tokenResponse.status, token }, null, 2))
    server.close()
    return
  }

  const saved = {
    ...token,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + Math.max(0, (token.expires_in || 7200) - 60) * 1000).toISOString(),
    scope: token.scope || scopes.join(' '),
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(saved, null, 2) + '\n', { mode: 0o600 })

  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  response.end(html({ title: 'X OAuth connected', body: `Token saved locally to ${TOKEN_PATH}. You can close this tab.` }))
  console.log(`[x-oauth2] Token saved to ${TOKEN_PATH}`)
  server.close()
})

server.listen(PORT, HOST, () => {
  console.log(`[x-oauth2] Callback listening on ${REDIRECT_URI}`)
  console.log('[x-oauth2] If X rejects the redirect, add this exact Callback URL in X Developer Portal:')
  console.log(REDIRECT_URI)
  console.log('[x-oauth2] Opening browser...')
  openUrl(authorizeUrl)
})
