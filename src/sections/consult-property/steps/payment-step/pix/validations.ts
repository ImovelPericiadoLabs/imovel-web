import { z } from 'zod'
import { isValidCPF } from '@/utils/cpf'

export const validations = z.object({
  name: z.string().min(3, 'Digite um nome válido').nonempty('O nome é obrigatório'),

  document: z
    .string()
    .nonempty('O CPF é obrigatório')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => isValidCPF(v), {
      message: 'CPF inválido',
    }),

  email: z
    .string()
    .nonempty('O E-mail é obrigatório')
    .refine((v) => !v || /\S+@\S+\.\S+/.test(v), {
      message: 'E-mail inválido',
    }),

  whatsapp: z
    .string()
    .nonempty('O WhatsApp é obrigatório')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length >= 10 && v.length <= 11, {
      message: 'WhatsApp inválido',
    }),

  code: z.string().optional(), 
  
  placeId: z.string().optional(), 
})

export type FormTypes = z.infer<typeof validations>