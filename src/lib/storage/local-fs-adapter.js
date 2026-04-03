import { promises as fs } from 'fs'
import path from 'path'

export class LocalFsAdapter {
  constructor(dataDir) {
    this.dataDir = path.resolve(dataDir)
  }

  _resolve(key) {
    // Prevent path traversal
    const resolved = path.resolve(path.join(this.dataDir, key))
    if (!resolved.startsWith(this.dataDir)) {
      throw new Error('Invalid storage key')
    }
    return resolved
  }

  async put(key, data, options = {}) {
    const filePath = this._resolve(key)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    const content = typeof data === 'string'
      ? data
      : Buffer.isBuffer(data)
        ? data
        : JSON.stringify(data)
    await fs.writeFile(filePath, content)
    return { url: `/api/storage/${key}` }
  }

  async get(key) {
    try {
      const content = await fs.readFile(this._resolve(key), 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  async list(prefix) {
    try {
      const dir = this._resolve(prefix)
      const entries = await fs.readdir(dir, { recursive: true })
      return entries.map(f => `${prefix}/${f}`.replace(/\\/g, '/'))
    } catch {
      return []
    }
  }

  async delete(key) {
    try {
      await fs.unlink(this._resolve(key))
    } catch {
      // Ignore if not found
    }
  }

  getUrl(key) {
    return `/api/storage/${key}`
  }
}
