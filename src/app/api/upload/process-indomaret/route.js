import { createUploadHandler } from '../../../../lib/business-upload-handler.js'

export const runtime = 'nodejs'

export const POST = createUploadHandler({
  storagePrefix: 'indomaret',
  defaultIdasFilename: 'IDAS_INDOMARET.xlsx',
  defaultManualFilename: 'ref_Indomaret.xlsx',
  historyFlag: 'indomaret',
})
