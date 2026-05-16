#!/usr/bin/env node

import { readLocalEnv, getEnv } from './lib/read-env.mjs'
import { buildOAuth1Header } from './lib/x-oauth1.mjs'

async function readStdin() {
  if (process.stdin.isTTY) return ''
  let data = ''
  for await (const chunk of process.stdin) data += chunk
  return data
}

function getCredentials() {
  const localEnv = readLocalEnv()
  const credentials = {
    consumerKey: getEnv('X_API_KEY', localEnv),
    consumerSecret: getEnv('X_API_SECRET', localEnv),
    token: getEnv('X_ACCESS_TOKEN', localEnv),
    tokenSecret: getEnv('X_ACCESS_TOKEN_SECRET', localEnv),
    oauth2UserToken: getEnv('X_OAUTH2_ACCESS_TOKEN', localEnv),
  }

  for (const [key, value] of Object.entries(credentials).filter(([key]) => key !== 'oauth2UserToken')) {
    if (!value) {
      throw new Error(`Missing ${key}. Add X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, and X_ACCESS_TOKEN_SECRET.`)
    }
  }

  return credentials
}

async function uploadImage(credentials, imageUrl) {
  const imageResponse = await fetch(imageUrl, { cache: 'no-store' })

  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`)
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
  const form = new FormData()
  form.append('media', new Blob([imageBuffer], { type: imageResponse.headers.get('content-type') || 'image/png' }), 'vesselsurge.png')

  const v2Upload = await uploadImageV2(credentials, imageBuffer, imageResponse.headers.get('content-type') || 'image/png')

  if (v2Upload.ok) return v2Upload.mediaId

  const legacyUpload = await uploadImageV1(credentials, imageBuffer, imageResponse.headers.get('content-type') || 'image/png')
  if (legacyUpload.ok) return legacyUpload.mediaId

  throw new Error(
    [
      'X media upload failed.',
      `v2: ${v2Upload.error}`,
      `v1.1: ${legacyUpload.error}`,
      'Fix in X Developer Portal: enable User authentication with Read and Write permissions, then regenerate the Access Token/Secret. For OAuth 2.0, add X_OAUTH2_ACCESS_TOKEN with User Context, not Application-Only bearer token.',
    ].join(' '),
  )
}

async function uploadImageV2(credentials, imageBuffer, mimeType) {
  const form = new FormData()
  form.append('media', new Blob([imageBuffer], { type: mimeType }), 'vesselsurge.png')
  form.append('media_category', 'tweet_image')

  const uploadUrl = 'https://api.x.com/2/media/upload'
  const headers = credentials.oauth2UserToken
    ? { authorization: `Bearer ${credentials.oauth2UserToken}` }
    : { authorization: buildOAuth1Header({ method: 'POST', url: uploadUrl, ...credentials }) }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: form,
  })
  const uploadBody = await uploadResponse.json().catch(() => ({}))

  if (uploadResponse.ok) {
    return { ok: true, mediaId: uploadBody.id || uploadBody.media_id_string }
  }

  return { ok: false, error: JSON.stringify({ status: uploadResponse.status, body: uploadBody }) }
}

async function uploadImageV1(credentials, imageBuffer, mimeType) {
  const form = new FormData()
  form.append('media', new Blob([imageBuffer], { type: mimeType }), 'vesselsurge.png')

  const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json'
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      authorization: buildOAuth1Header({ method: 'POST', url: uploadUrl, ...credentials }),
    },
    body: form,
  })
  const uploadBody = await uploadResponse.json().catch(() => ({}))

  if (uploadResponse.ok) {
    return { ok: true, mediaId: uploadBody.media_id_string }
  }

  return { ok: false, error: JSON.stringify({ status: uploadResponse.status, body: uploadBody }) }
}

async function setAltText(credentials, mediaId, altText) {
  if (!altText) return

  const metadataUrl = 'https://upload.twitter.com/1.1/media/metadata/create.json'
  const response = await fetch(metadataUrl, {
    method: 'POST',
    headers: {
      authorization: buildOAuth1Header({ method: 'POST', url: metadataUrl, ...credentials }),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      media_id: mediaId,
      alt_text: {
        text: altText.slice(0, 1000),
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.warn(`[x-post-image] Alt text failed but media upload succeeded: ${response.status} ${body}`)
  }
}

async function createTweet(credentials, text, mediaId) {
  const tweetUrl = 'https://api.x.com/2/tweets'
  const response = await fetch(tweetUrl, {
    method: 'POST',
    headers: {
      authorization: buildOAuth1Header({ method: 'POST', url: tweetUrl, ...credentials }),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      text,
      media: {
        media_ids: [mediaId],
      },
    }),
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`X post failed: ${JSON.stringify({ status: response.status, body })}`)
  }

  return body
}

const args = process.argv.slice(2)
const imageUrlIndex = args.findIndex((arg) => arg === '--image-url')
const altTextIndex = args.findIndex((arg) => arg === '--alt-text')
const imageUrl = imageUrlIndex >= 0 ? args[imageUrlIndex + 1] : ''
const altText = altTextIndex >= 0 ? args[altTextIndex + 1] : ''
const textArgs = args.filter((_, index) => ![imageUrlIndex, imageUrlIndex + 1, altTextIndex, altTextIndex + 1].includes(index))
const text = (textArgs.join(' ') || await readStdin()).trim()

if (!text) {
  console.error('[x-post-image] Missing post text.')
  process.exit(1)
}

if (!imageUrl) {
  console.error('[x-post-image] Missing --image-url.')
  process.exit(1)
}

if (text.length > 280) {
  console.error(`[x-post-image] Post is ${text.length} characters. Keep it at 280 or below.`)
  process.exit(1)
}

try {
  const credentials = getCredentials()
  const mediaId = await uploadImage(credentials, imageUrl)
  await setAltText(credentials, mediaId, altText)
  const tweet = await createTweet(credentials, text, mediaId)

  console.log('[x-post-image] Posted to X')
  console.log(JSON.stringify(tweet, null, 2))
} catch (error) {
  console.error(`[x-post-image] ${error.message}`)
  process.exit(1)
}
