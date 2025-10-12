import { defineConfig } from 'vitest/config'
import fs from 'node:fs'
import path from 'node:path'

// Attempt to load Docker Postgres env for integration tests, if DATABASE_URL is not set
try {
  if (!process.env.DATABASE_URL) {
    const root = process.cwd()
    const envPath = path.join(root, '.env.docker')
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf-8')
      const map = Object.fromEntries(
        raw.split(/\r?\n/)
          .filter(Boolean)
          .filter((l) => !l.trim().startsWith('#'))
          .map((l) => l.split('=')).map(([k, ...rest]) => [k.trim(), rest.join('=').trim()])
      ) as Record<string,string>
      const U = map.POSTGRES_USER
      const P = map.POSTGRES_PASSWORD
      const D = map.POSTGRES_DB
      if (U && P && D) {
        process.env.DATABASE_URL = `postgresql://${U}:${P}@127.0.0.1:5432/${D}?sslmode=disable`
      }
    }
  }
} catch {}

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**']
  }
})
