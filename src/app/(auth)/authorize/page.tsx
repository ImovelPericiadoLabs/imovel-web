import AuthorizeClient from './authorize-client'

type SearchParams = Record<string, string | string[] | undefined>

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  return <AuthorizeClient searchParams={params} />
}
