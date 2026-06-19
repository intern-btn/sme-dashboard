import { createClient } from '@libsql/client'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

const MIGRATION_TABLE = '_app_migrations'

function loadEnvFile(filePath, { override = false } = {}) {
  if (!existsSync(filePath)) return

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!match) continue

    const key = match[1]
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    if (override || process.env[key] == null) {
      process.env[key] = value
    }
  }
}

function getMigrationDirs(migrationsPath) {
  return readdirSync(migrationsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function parseArgs(argv) {
  return {
    baselineExisting: argv.includes('--baseline-existing'),
    allowProduction: argv.includes('--allow-production'),
    dryRun: argv.includes('--dry-run'),
  }
}

function isLikelyProductionUrl(url) {
  return /prod|production/i.test(url)
}

async function ensureMigrationTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "${MIGRATION_TABLE}" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function getAppliedMigrations(client) {
  const result = await client.execute(`SELECT "name" FROM "${MIGRATION_TABLE}" ORDER BY "name"`)
  return new Set(result.rows.map((row) => row.name))
}

async function recordMigration(client, name) {
  await client.execute({
    sql: `INSERT OR IGNORE INTO "${MIGRATION_TABLE}" ("name") VALUES (?)`,
    args: [name],
  })
}

async function baselineExistingMigrations(client, migrationDirs) {
  const migrationsToBaseline = migrationDirs.slice(0, -1)
  if (migrationsToBaseline.length === 0) return

  for (const name of migrationsToBaseline) {
    await recordMigration(client, name)
  }

  console.log(`Baselined ${migrationsToBaseline.length} existing migration(s).`)
  console.log(`Newest migration left pending: ${migrationDirs[migrationDirs.length - 1]}`)
}

async function applyMigration(client, migrationsPath, name) {
  const migrationFile = join(migrationsPath, name, 'migration.sql')
  const sql = readFileSync(migrationFile, 'utf8').trim()

  if (!sql) {
    await recordMigration(client, name)
    console.log(`Skipped empty migration: ${name}`)
    return
  }

  console.log(`Applying migration: ${name}`)
  await client.executeMultiple(sql)
  await recordMigration(client, name)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const cwd = process.cwd()

  // Load order: .env.local overrides .env, but external shell vars always win
  loadEnvFile(resolve(cwd, '.env.local'))
  loadEnvFile(resolve(cwd, '.env'))

  const url = process.env.DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }

  if (!url.startsWith('libsql://') && !url.startsWith('file:') && !url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(`Unsupported DATABASE_URL for libSQL migrations: ${url}`)
  }

  if (isLikelyProductionUrl(url) && !args.allowProduction) {
    throw new Error('DATABASE_URL looks like production. Re-run with --allow-production if this is intentional.')
  }

  const migrationsPath = resolve(cwd, 'prisma', 'migrations')
  const migrationDirs = getMigrationDirs(migrationsPath)

  if (migrationDirs.length === 0) {
    console.log('No migration directories found.')
    return
  }

  console.log(`Target database: ${url}`)
  console.log(`Migration table: ${MIGRATION_TABLE}`)

  if (args.dryRun) {
    const pending = args.baselineExisting ? migrationDirs.slice(-1) : migrationDirs
    console.log('Dry run only. No database connection will be opened.')
    console.log(`Migrations ${args.baselineExisting ? 'left pending after baseline' : 'found'}:`)
    for (const name of pending) {
      console.log(`- ${name}`)
    }
    return
  }

  const client = createClient({ url, authToken })

  try {
    await ensureMigrationTable(client)

    let applied = await getAppliedMigrations(client)
    if (args.baselineExisting && applied.size === 0) {
      await baselineExistingMigrations(client, migrationDirs)
      applied = await getAppliedMigrations(client)
    }

    const pending = migrationDirs.filter((name) => !applied.has(name))
    if (pending.length === 0) {
      console.log('No pending migrations.')
      return
    }

    for (const name of pending) {
      await applyMigration(client, migrationsPath, name)
    }

    console.log(`Applied ${pending.length} migration(s).`)
  } finally {
    client.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
