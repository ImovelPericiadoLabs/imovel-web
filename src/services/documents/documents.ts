import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'

export type UploadDocumentResponse = {
  id?: string
  [key: string]: unknown
}

export async function uploadDocument(
  file: File,
  documentType: string,
  onProgress: (progress: number) => void
): Promise<UploadDocumentResponse> {
  return api.upload(endpoint.documents.upload, documentType, file, onProgress) as Promise<UploadDocumentResponse>
}
