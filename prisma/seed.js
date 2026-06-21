import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '../src/generated/prisma/client.ts'
import { PrismaMssql } from '@prisma/adapter-mssql'
import bcrypt from 'bcryptjs'

function parseSqlServerUrl(url) {
  const withoutScheme = url.replace(/^sqlserver:\/\//, '')
  const parts = withoutScheme.split(';')
  const [server, portStr] = parts[0].split(':')
  const params = {}
  for (const part of parts.slice(1)) {
    const idx = part.indexOf('=')
    if (idx > 0) params[part.slice(0, idx).toLowerCase().trim()] = part.slice(idx + 1).trim()
  }
  return {
    server,
    port: portStr ? Number(portStr) : 1433,
    database: params.database || params['initial catalog'],
    user: params.user || params['user id'] || params.uid,
    password: params.password || params.pwd,
    options: {
      encrypt: params.encrypt !== 'false',
      trustServerCertificate: params.trustservercertificate === 'true',
    },
  }
}

// Load env files — shell vars win, then .env.local, then .env
for (const envFile of ['.env.local', '.env']) {
  try {
    const lines = readFileSync(resolve(process.cwd(), envFile), 'utf-8').split(/\r?\n/)
    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (match && process.env[match[1]] == null) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
      }
    }
  } catch { /* file not found */ }
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const adapter = new PrismaMssql(parseSqlServerUrl(url))
  const prisma = new PrismaClient({ adapter })

  try {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        passwordHash,
        displayName: 'Administrator',
        role: 'admin',
      },
    })

    console.log(`Seeded admin user: ${admin.username} (role: ${admin.role})`)
    console.log('Login with username "admin" and the value of ADMIN_PASSWORD env var.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
