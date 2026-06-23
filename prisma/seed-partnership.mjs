import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { serializeTasks } from '../src/lib/partnership.js'

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const authToken = process.env.TURSO_AUTH_TOKEN
  const adapter = new PrismaLibSql({ url, authToken })
  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

/**
 * Partner data with full task details
 */
const partnersData = [
  {
    name: 'RSUP Fatmawati',
    priority: 'High',
    startDate: new Date('2026-05-17'),
    endDate: new Date('2026-07-14'),
    lastUpdateStatus: 'Persetujuan Direksi',
    tasks: [
      { name: 'Pertemuan Awal', pic: 'Mas Afif', progress: 1.0, startDate: '2026-05-17', endDate: '2026-05-20' },
      { name: 'Meeting Internal Divisi', pic: 'Mas Afif', progress: 1.0, startDate: '2026-05-20', endDate: '2026-05-27' },
      { name: 'Kajian RAC', pic: 'Mas Afif', progress: 1.0, startDate: '2026-05-27', endDate: '2026-06-10' },
      { name: 'Persetujuan Direksi', pic: 'Mas Afif', progress: 0.35, startDate: '2026-06-10', endDate: '2026-06-17' },
      { name: 'PKS', pic: 'Mas Afif', progress: 0, startDate: '2026-06-17', endDate: '2026-07-01' },
      { name: 'Sosialisasi Internal', pic: 'Mas Afif', progress: 0, startDate: '2026-07-01', endDate: '2026-07-06' },
      { name: 'Memo ke KC', pic: 'Mas Afif', progress: 0, startDate: '2026-07-06', endDate: '2026-07-09' },
      { name: 'Sosialisasi Eksternal', pic: 'Mas Afif', progress: 0, startDate: '2026-07-09', endDate: '2026-07-14' },
    ],
  },
  {
    name: 'Pelindo Solusi Maritim',
    priority: 'High',
    startDate: new Date('2026-05-19'),
    endDate: new Date('2026-07-16'),
    lastUpdateStatus: 'Kajian RAC',
    tasks: [
      { name: 'Pertemuan Awal', pic: 'Mas Afif', progress: 1.0, startDate: '2026-05-19', endDate: '2026-05-22' },
      { name: 'Meeting Internal Divisi', pic: 'Mas Afif', progress: 1.0, startDate: '2026-05-22', endDate: '2026-05-29' },
      { name: 'Kajian RAC', pic: 'Mas Afif', progress: 0.5, startDate: '2026-05-29', endDate: '2026-06-12' },
      { name: 'Persetujuan Direksi', pic: 'Mas Afif', progress: 0, startDate: '2026-06-12', endDate: '2026-06-19' },
      { name: 'PKS', pic: 'Mas Afif', progress: 0, startDate: '2026-06-19', endDate: '2026-07-03' },
      { name: 'Sosialisasi Internal', pic: 'Mas Afif', progress: 0, startDate: '2026-07-03', endDate: '2026-07-08' },
      { name: 'Memo ke KC', pic: 'Mas Afif', progress: 0, startDate: '2026-07-08', endDate: '2026-07-13' },
      { name: 'Sosialisasi Eksternal', pic: 'Mas Afif', progress: 0, startDate: '2026-07-13', endDate: '2026-07-16' },
    ],
  },
  {
    name: 'Rajawali Nusindo (RNI)',
    priority: 'Medium',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-07-29'),
    lastUpdateStatus: 'Meeting Internal Divisi',
    tasks: [
      { name: 'Pertemuan Awal', pic: 'Mas Afif', progress: 1.0, startDate: '2026-06-01', endDate: '2026-06-04' },
      { name: 'Meeting Internal Divisi', pic: 'Mas Afif', progress: 0.5, startDate: '2026-06-04', endDate: '2026-06-11' },
      { name: 'Kajian RAC', pic: 'Mas Afif', progress: 0, startDate: '2026-06-11', endDate: '2026-06-25' },
      { name: 'Persetujuan Direksi', pic: 'Mas Afif', progress: 0, startDate: '2026-06-25', endDate: '2026-07-02' },
      { name: 'PKS', pic: 'Mas Afif', progress: 0, startDate: '2026-07-02', endDate: '2026-07-16' },
      { name: 'Sosialisasi Internal', pic: 'Mas Afif', progress: 0, startDate: '2026-07-16', endDate: '2026-07-21' },
      { name: 'Memo ke KC', pic: 'Mas Afif', progress: 0, startDate: '2026-07-21', endDate: '2026-07-24' },
      { name: 'Sosialisasi Eksternal', pic: 'Mas Afif', progress: 0, startDate: '2026-07-24', endDate: '2026-07-29' },
    ],
  },
  {
    name: 'Green Mobius',
    priority: 'High',
    startDate: new Date('2026-05-20'),
    endDate: new Date('2026-07-17'),
    lastUpdateStatus: 'Kajian RAC',
    tasks: [
      { name: 'Pertemuan Awal', pic: 'Mas Afif', progress: 1.0, startDate: '2026-05-20', endDate: '2026-05-25' },
      { name: 'Meeting Internal Divisi', pic: 'Mas Afif', progress: 1.0, startDate: '2026-05-25', endDate: '2026-06-01' },
      { name: 'Kajian RAC', pic: 'Mas Afif', progress: 0.5, startDate: '2026-06-01', endDate: '2026-06-15' },
      { name: 'Persetujuan Direksi', pic: 'Mas Afif', progress: 0, startDate: '2026-06-15', endDate: '2026-06-22' },
      { name: 'PKS', pic: 'Mas Afif', progress: 0, startDate: '2026-06-22', endDate: '2026-07-06' },
      { name: 'Sosialisasi Internal', pic: 'Mas Afif', progress: 0, startDate: '2026-07-06', endDate: '2026-07-09' },
      { name: 'Memo ke KC', pic: 'Mas Afif', progress: 0, startDate: '2026-07-09', endDate: '2026-07-14' },
      { name: 'Sosialisasi Eksternal', pic: 'Mas Afif', progress: 0, startDate: '2026-07-14', endDate: '2026-07-17' },
    ],
  },
]

async function main() {
  console.log('Starting Partnership seed...')

  for (const partnerData of partnersData) {
    // Check if partner exists by name
    const existing = await prisma.partnership.findFirst({
      where: { name: partnerData.name },
    })

    if (existing) {
      console.log(`✓ Partner "${partnerData.name}" already exists (id: ${existing.id})`)
      continue
    }

    // Create the partner with serialized tasks
    const created = await prisma.partnership.create({
      data: {
        name: partnerData.name,
        priority: partnerData.priority,
        startDate: partnerData.startDate,
        endDate: partnerData.endDate,
        lastUpdateStatus: partnerData.lastUpdateStatus,
        tasks: serializeTasks(partnerData.tasks),
        createdBy: 'seed',
      },
    })

    console.log(`✓ Created partner "${partnerData.name}" (id: ${created.id}) with ${partnerData.tasks.length} tasks`)
  }

  console.log('Partnership seed completed successfully!')
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
