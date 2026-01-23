import { z } from 'zod'

const DocumentTypeEnum = z.enum(['agreement', 'registration', 'deed'])

export const validations = z
  .object({
    address: z.string().min(3, 'Digite um endereço válido').nonempty('O endereço é obrigatório'),
    allotment: z.string().optional(),
    noAllotment: z.boolean().nullable().optional(),
    block: z.string().optional(),
    noBlock: z.boolean().nullable().optional(),
    lot: z.string().optional(),
    noLot: z.boolean().nullable().optional(),
    complement: z.string().optional(),
    unknownRegistration: z.boolean().nullable().optional(),
    registrationNumber: z.string().optional().nullable(),
    placeId: z.string(),
    registry: z.object({
      id: z.string().uuid(),
      name: z.string(),
      number: z.number(),
      slug: z.string(),
      coverage: z.array(z.string()),
    }).optional().nullable(),
    hasDocument: z.any(),
    documentType: DocumentTypeEnum.optional(),
    document: z
      .object({
        id: z.string(),
        file_path: z.string(),
        file_hash: z.string().nullable(),
        original_name: z.string(),
        extension: z.string(),
      })
      .optional()
      .nullable(),
    documentPreview: z.any().optional(),
    paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'boleto']),
  })
  .refine(
    (data) => {
      if (data.hasDocument === true) {
        return !!data.documentType
      }
      return true
    },
    {
      message: 'O tipo de documento é obrigatório',
      path: ['documentType'],
    },
  )
  .refine(
    (data) => {
      if (data.hasDocument === true) {
        return !!data.document && !!data.document.id
      }
      return true
    },
    {
      message: 'O documento é obrigatório',
      path: ['document'],
    },
  )
  .refine(
    (data) => {
      if (data.unknownRegistration === false) {
        return !!data.registrationNumber && data.registrationNumber.trim().length > 0
      }
      return true
    },
    {
      message: 'Informe o número da matrícula',
      path: ['registrationNumber'],
    }
  )
  .refine(
    (data) => {
      if (data.noAllotment === false) {
        return !!data.allotment && data.allotment.trim().length > 0
      }
      return true
    },
    {
      message: 'Informe o loteamento',
      path: ['allotment'],
    }
  )
  .refine(
    (data) => {
      if (data.noBlock === false) {
        return !!data.block && data.block.trim().length > 0
      }
      return true
    },
    {
      message: 'Informe a quadra',
      path: ['block'],
    }
  )
  .refine(
    (data) => {
      if (data.noLot === false) {
        return !!data.lot && data.lot.trim().length > 0
      }
      return true
    },
    {
      message: 'Informe o lote',
      path: ['lot'],
    }
  )

export type FormTypes = z.infer<typeof validations>
