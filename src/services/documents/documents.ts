import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'

export async function uploadDocument(file: File, documentType: string, onProgress: (progress: number) => void) {
  return api.upload(endpoint.documents.upload, documentType, file, onProgress)
}
