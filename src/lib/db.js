import { PrismaClient } from '../generated/prisma/client.ts'
import { PrismaMssql } from '@prisma/adapter-mssql'

// Parse Prisma's sqlserver:// URL into a mssql config object
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

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const adapter = new PrismaMssql(parseSqlServerUrl(url))
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
