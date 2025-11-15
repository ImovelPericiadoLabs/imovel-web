import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'

export async function uploadDocument(file: File) {
  const formData = new FormData()
  formData.append('file_path', file, file.name)
  return api.post(endpoint.documents.upload, formData)
}
