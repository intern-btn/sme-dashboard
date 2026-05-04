import { createUploadHandler } from '../../../../lib/business-upload-handler.js'

export const runtime = 'nodejs'

export const POST = createUploadHandler({
  storagePrefix: 'bpjs',
  defaultIdasFilename: 'IDAS_BPJS.xlsx',
  defaultManualFilename: 'ref_BPJS.xlsx',
  historyFlag: 'bpjs',
})
