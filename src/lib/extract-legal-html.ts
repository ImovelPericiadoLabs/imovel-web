
export function stripScriptTags(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}

export function extractLegalDocumentFragment(fullHtml: string): string {
  const byMainId = fullHtml.match(
    /<main[^>]*\bid=["']conteudo-principal["'][^>]*>([\s\S]*?)<\/main>/i,
  )
  if (byMainId?.[1]) {
    return stripScriptTags(byMainId[1]).trim()
  }

  const byMain = fullHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  if (byMain?.[1]) {
    return stripScriptTags(byMain[1]).trim()
  }

  const byArticle = fullHtml.match(/<article[^>]*class=["'][^"']*legal-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/i)
  if (byArticle?.[1]) {
    return stripScriptTags(byArticle[1]).trim()
  }

  return stripScriptTags(fullHtml).trim()
}
