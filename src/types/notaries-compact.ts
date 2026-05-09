/**
 * Uma linha: UF, município, índice interno da base compacta, nome canônico (ONR).
 * O grau oficial do cartório está no `label` quando presente (ex.: "12º OFICIAL…");
 * o terceiro campo pode não coincidir com esse grau (ex.: comarcas com vários ofícios).
 */
export type NotaryOfficeRow = readonly [uf: string, city: string, number: number, label: string]

export type NotariesCompactFile = {
  v: number
  o: NotaryOfficeRow[]
}
