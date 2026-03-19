import { describe, expect, it } from 'vitest'
import { extractLegalDocumentFragment, stripScriptTags } from './extract-legal-html'

describe('stripScriptTags', () => {
  it('remove tags script', () => {
    expect(stripScriptTags('<p>a</p><script>evil()</script><p>b</p>')).toBe('<p>a</p><p>b</p>')
  })
})

describe('extractLegalDocumentFragment', () => {
  it('extrai pelo main#conteudo-principal', () => {
    const html = `<!DOCTYPE html><html><body>
      <main id="conteudo-principal" class="legal-main"><article><p>Conteúdo</p></article></main>
      <script>console.log(1)</script></body></html>`
    expect(extractLegalDocumentFragment(html)).toContain('<p>Conteúdo</p>')
    expect(extractLegalDocumentFragment(html)).not.toContain('console.log')
  })

  it('usa primeiro main como fallback', () => {
    const html = '<html><body><main><div>OK</div></main></body></html>'
    expect(extractLegalDocumentFragment(html)).toContain('<div>OK</div>')
  })
})
