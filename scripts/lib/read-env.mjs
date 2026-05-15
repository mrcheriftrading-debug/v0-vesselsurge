import fs from 'node:fs'
import path from 'node:path'

export function readLocalEnv(root = process.cwd()) {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) return {}

  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=')
        if (separator === -1) return [line, '']
        const key = line.slice(0, separator).trim()
        const rawValue = line.slice(separator + 1).trim()
        const value = rawValue.replace(/^['"]|['"]$/g, '')
        return [key, value]
      }),
  )
}

export function getEnv(name, localEnv) {
  return process.env[name] || localEnv[name]
}
