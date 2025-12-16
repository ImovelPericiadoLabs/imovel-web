import { PropsWithChildren } from 'react'

export default function PedidoLayout({ children }: PropsWithChildren) {
  return <div className="flex flex-col">{children}</div>
}
