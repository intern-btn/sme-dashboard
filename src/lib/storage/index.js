import { VercelBlobAdapter } from './vercel-blob-adapter.js'
import { LocalFsAdapter } from './local-fs-adapter.js'

let _adapter = null

export function getStorage() {
  if (_adapter) return _adapter

  const provider = process.env.STORAGE_PROVIDER

  if (provider === 'local' || !process.env.BLOB_READ_WRITE_TOKEN) {
    const dataDir = process.env.DATA_DIR || './data'
    _adapter = new LocalFsAdapter(dataDir)
  } else {
    _adapter = new VercelBlobAdapter()
  }

  return _adapter
}

// Reset adapter (useful for testing)
export function resetStorage() {
  _adapter = null
}
