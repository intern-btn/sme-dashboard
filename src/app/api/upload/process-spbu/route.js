import { createUploadHandler } from '../../../../lib/business-upload-handler.js'

export const runtime = 'nodejs'

export const POST = createUploadHandler({
  storagePrefix: 'prk_spbu',
  defaultIdasFilename: 'IDAS_PRK_SPBU.xlsx',
  defaultManualFilename: 'ref_PRK_SPBU.xlsx',
  historyFlag: 'spbu',
})
