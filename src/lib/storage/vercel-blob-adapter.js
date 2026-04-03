import { put, list, del } from '@vercel/blob'

export class VercelBlobAdapter {
  async put(key, data, options = {}) {
    const body = typeof data === 'string' || Buffer.isBuffer(data)
      ? data
      : JSON.stringify(data)
    return await put(key, body, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: options.allowOverwrite !== false,
    })
  }

  async get(key) {
    const url = this.getUrl(key)
    try {
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  async list(prefix) {
    try {
      const result = await list({ prefix })
      return result.blobs.map(b => b.pathname)
    } catch {
      return []
    }
  }

  async delete(key) {
    try {
      const url = this.getUrl(key)
      await del(url)
    } catch {
      // Ignore if not found
    }
  }

  getUrl(key) {
    return `${process.env.BLOB_BASE_URL}/${key}`
  }
}
