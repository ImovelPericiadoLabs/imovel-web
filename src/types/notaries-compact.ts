/** Uma linha: UF, município, número oficial do cartório, nome canônico (ONR). */
export type NotaryOfficeRow = readonly [uf: string, city: string, number: number, label: string]

export type NotariesCompactFile = {
  v: number
  o: NotaryOfficeRow[]
}
