import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/consultar-imovel')
  return <h1>home</h1>
}
