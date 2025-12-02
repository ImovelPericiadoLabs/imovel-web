import { PropsWithChildren } from 'react'

export default function PedidoLayout({ children }: PropsWithChildren) {
  return <div className="flex flex-col px-3 py-4">{children}</div>
}
