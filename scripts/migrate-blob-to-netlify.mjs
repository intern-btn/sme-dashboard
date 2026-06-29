import { list, head } from '@vercel/blob'
import { getStore } from '@netlify/blobs'

const STORE_NAME = process.env.NETLIFY_BLOBS_STORE || 'sme-dashboard-storage'

async function fetchBlob(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

async function migrate() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required to read Vercel Blob data')
  }
  if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) {
    throw new Error('NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN are required to write Netlify Blobs locally')
  }

  const store = getStore(STORE_NAME)
  let cursor
  let copied = 0

  do {
    const page = await list({ cursor, limit: 1000 })
    cursor = page.cursor

    for (const blob of page.blobs) {
      const pathname = blob.pathname
      const source = blob.url || (await head(pathname)).url
      const data = await fetchBlob(source)

      await store.set(pathname, data)
      copied += 1
      console.log(`copied ${pathname}`)
    }
  } while (cursor)

  console.log(`Migration complete. Copied ${copied} blob(s) into Netlify store "${STORE_NAME}".`)
}

migrate().catch((error) => {
  console.error(error)
  process.exit(1)
})
