import { getStore } from '@netlify/blobs'

const STORE_NAME = 'sme-dashboard-storage'

function normalizeData(data) {
  return typeof data === 'string' || Buffer.isBuffer(data)
    ? data
    : JSON.stringify(data)
}

export class NetlifyBlobAdapter {
  constructor(storeName = STORE_NAME) {
    this.store = getStore(storeName)
  }

  async put(key, data, options = {}) {
    if (options.allowOverwrite === false) {
      const existing = await this.store.get(key, { type: 'arrayBuffer' })
      if (existing !== null) {
        throw new Error(`Storage key already exists: ${key}`)
      }
    }

    await this.store.set(key, normalizeData(data), {
      metadata: options.metadata,
    })

    return { url: this.getUrl(key) }
  }

  async get(key) {
    try {
      const text = await this.store.get(key, { type: 'text' })
      if (text === null) return null
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  async getRaw(key) {
    return await this.store.get(key, { type: 'arrayBuffer' })
  }

  async list(prefix = '') {
    try {
      const result = await this.store.list({ prefix })
      return result.blobs.map((blob) => blob.key)
    } catch {
      return []
    }
  }

  async delete(key) {
    try {
      await this.store.delete(key)
    } catch {
      // Ignore missing keys.
    }
  }

  getUrl(key) {
    return `/api/storage/${key}`
  }
}
