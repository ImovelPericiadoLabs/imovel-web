import { z } from 'zod'

const DocumentTypeEnum = z.enum(['contract', 'registration', 'deed'])

export const validations = z.object({
  address: z.string().min(5, 'Digite um endereço válido').nonempty('O endereço é obrigatório'),
  hasDocument: z.any(),
  documentType: DocumentTypeEnum.optional(),
})

export type FormTypes = z.infer<typeof validations>
