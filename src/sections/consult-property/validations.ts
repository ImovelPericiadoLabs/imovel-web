import { z } from 'zod'

export const validations = z.object({
  address: z.string().min(5, 'Digite um endereço válido').nonempty('O endereço é obrigatório'),
})

export type FormTypes = z.infer<typeof validations>
