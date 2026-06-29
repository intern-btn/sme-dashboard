import { LocalFsAdapter } from './local-fs-adapter.js'
import { NetlifyBlobAdapter } from './netlify-blob-adapter.js'

let _adapter = null

export function getStorage() {
  if (_adapter) return _adapter

  const provider = process.env.STORAGE_PROVIDER

  if (provider === 'netlify-blob' || (!provider && process.env.NETLIFY)) {
    _adapter = new NetlifyBlobAdapter()
    return _adapter
  }

  if (provider === 'local' || !process.env.BLOB_READ_WRITE_TOKEN) {
    const dataDir = process.env.DATA_DIR || './data'
    _adapter = new LocalFsAdapter(dataDir)
    return _adapter
  }

  throw new Error(`Unsupported storage provider: ${provider || 'unset'}`)
}

// Reset adapter (useful for testing)
export function resetStorage() {
  _adapter = null
}
