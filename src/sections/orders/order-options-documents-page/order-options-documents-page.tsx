import { Download } from 'lucide-react'
import OrderHeader from '@/sections/orders/order-header'
import BadgeComponent from '@/components/badge'

export default function OrderOptionsDocumentsPage() {
  const documents = [
    {
      id: 1,
      type: 'Contrato de compra e venda',
      name: 'JULIO BARBOSA LEMES FILHO - Estadual - Processo 6e0c39306b05cfe.pdf',
    },
    {
      id: 2,
      type: 'Escritura do imóvel',
      name: 'JULIO BARBOSA LEMES FILHO - Estadual - Processo 6e0c39306b05cfe.pdf',
    },
    {
      id: 3,
      type: 'Matrícula do Imóvel ',
      name: 'JULIO BARBOSA LEMES FILHO - Estadual - Processo 6e0c39306b05cfe.pdf',
    },
    {
      id: 4,
      type: 'Acordo de compra e venda',
      name: 'JULIO BARBOSA LEMES FILHO - Estadual - Processo 6e0c39306b05cfe.pdf',
    },
  ]
  return (
    <div className="flex flex-col gap-3">
      <OrderHeader Badge={<BadgeComponent variant="danger">Sinal Vermelho</BadgeComponent>} />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {documents.map((document) => (
          <div
            key={document.id}
            className="cursor-pointer flex flex-col p-4 border border-box rounded-sm group hover:border-primary"
          >
            <div className="flex gap-4 items-center">
              <Download className="size-6 text-primary" />

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold leading-[130%] group-hover:text-primary">
                  {document.type}
                </p>

                <p className="text-dark text-xs font-normal leading-4 group-hover:text-primary">
                  {document.name}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
