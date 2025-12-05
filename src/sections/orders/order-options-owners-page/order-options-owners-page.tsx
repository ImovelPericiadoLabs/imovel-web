import { User } from 'lucide-react'
import OrderHeader from '@/sections/orders/order-header'
import BadgeComponent from '@/components/badge'

export default function OrderOptionsOwnersPage() {
  const owners = [
    {
      id: 1,
      name: 'JULIO BARBOSA LEMES FILHO',
      document: '159.256.252-00',
      percentage: 100,
    },
    {
      id: 2,
      name: 'MARIANA SANTOS',
      document: '123.456.789-01',
      percentage: 75,
    },
    {
      id: 3,
      name: 'CARLOS ANDRADE',
      document: '987.654.321-09',
      percentage: 50,
    },
    {
      id: 4,
      name: 'ANA CARLA DA SILVA',
      document: '123.456.789-10',
      percentage: 75,
    },
  ]
  return (
    <div className="flex flex-col gap-3">
      <OrderHeader Badge={<BadgeComponent variant="danger">Sinal Vermelho</BadgeComponent>} />

      <div className="flex flex-col gap-2 px-3 lg:px-0 w-full mx-auto lg:max-w-lg">
        {owners.map((owner) => (
          <div
            key={owner.id}
            className="flex flex-col p-4 border border-box rounded-sm group hover:border-primary"
          >
            <div className="flex gap-4 items-center">
              <User className="size-6 text-primary" />

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold leading-[130%] group-hover:text-primary">
                  {owner.name}
                </p>

                <p className="text-dark text-xs font-normal leading-4 group-hover:text-primary">
                  {owner.document}
                </p>

                <BadgeComponent>Possui {owner.percentage}%</BadgeComponent>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
