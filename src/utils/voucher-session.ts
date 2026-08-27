/**
 * Guarda o código do voucher entre `/resgate` e o checkout em `/consultar-imovel`.
 *
 * `sessionStorage` e não a URL: o código é o portador do benefício — quem o tem, usa.
 * Carregá-lo na barra de endereço até o fim do fluxo faz com que ele vaze em print de
 * tela, histórico e no `Referer` de qualquer recurso de terceiro da página.
 *
 * Some ao fechar a aba, o que é o comportamento certo aqui: o benefício está no papel
 * na mão da pessoa, então recomeçar é reescanear o QR — não há nada a recuperar.
 */
const KEY = '@voucher:code'

export function rememberVoucherCode(code: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(KEY, code)
  } catch {
    // Safari privado e afins: sem persistência o fluxo segue pago, não quebrado.
  }
}

export function readVoucherCode(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function forgetVoucherCode(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // Idem: nada a fazer, e falhar aqui não pode derrubar a tela.
  }
}
