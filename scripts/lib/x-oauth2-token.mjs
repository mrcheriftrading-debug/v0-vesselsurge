import fs from 'node:fs'

const TOKEN_PATH = '.x-oauth2-token.json'

export function readOAuth2Token() {
  if (!fs.existsSync(TOKEN_PATH)) return null

  try {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
  } catch {
    return null
  }
}

export function getOAuth2AccessToken(localEnv = {}) {
  return process.env.X_OAUTH2_ACCESS_TOKEN || localEnv.X_OAUTH2_ACCESS_TOKEN || readOAuth2Token()?.access_token || ''
}
