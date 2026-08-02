import { z } from 'zod'

const DocumentTypeEnum = z.enum(['agreement', 'registration', 'deed'])

export const validations = z
  .object({
    address: z.string().default(''),
    allotment: z.string().optional(),
    noAllotment: z.boolean().nullable().optional(),
    block: z.string().optional(),
    noBlock: z.boolean().nullable().optional(),
    lot: z.string().optional(),
    noLot: z.boolean().nullable().optional(),
    complement: z.string().optional(),
    addressNumber: z.string().optional(),
    noAddressNumber: z.boolean().nullable().optional(),
    unknownRegistration: z.boolean().nullable().optional(),
    registrationNumber: z.string().optional().nullable(),
    /** Nome do cartório quando o usuário não passou pelo mapa (fluxo matrícula + cartório). */
    notaryName: z.string().max(150, 'Nome do cartório muito longo').default(''),
    notaryState: z.string().max(2, 'UF inválida').default(''),
    notaryCity: z.string().max(120, 'Cidade muito longa').default(''),
    placeId: z.string().default(''),
    addressHint: z.string().default(''),
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
    entryPath: z.enum(['address', 'document', 'registry']).optional(),
    includeCertificates: z.boolean().default(false),
    /** Código do imóvel e tenant quando a consulta veio da integração Jetimob. */
    jetimobPropertyCode: z.string().default(''),
    jetimobSystemId: z.string().default(''),
  })
  .refine(
    (data) => {
      const pid = (data.placeId || '').trim()
      if (pid.length > 0) {
        return (data.address || '').trim().length >= 3
      }
      return true
    },
    {
      message: 'Digite um endereço válido',
      path: ['address'],
    },
  )
  .refine(
    (data) => {
      const pid = (data.placeId || '').trim()
      const hint = (data.addressHint || '').trim()
      const hasDoc = data.hasDocument === true && !!data.document?.id
      const reg = (data.registrationNumber || '').trim()
      const cart = (data.notaryName || '').trim()
      const hasMatriculaCartorio = reg.length >= 1 && cart.length >= 3
      return pid.length > 0 || hasDoc || hint.length >= 10 || hasMatriculaCartorio
    },
    {
      message:
        'Selecione um endereço na busca, descreva o local (mínimo 10 caracteres), informe matrícula e cartório, ou envie um documento do imóvel.',
      path: ['addressHint'],
    },
  )
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
      if (data.noAddressNumber === false) {
        return !!data.addressNumber && data.addressNumber.trim().length > 0
      }
      return true
    },
    {
      message: 'Informe o número do endereço',
      path: ['addressNumber'],
    }
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
