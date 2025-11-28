import TextTitle from '@/components/text-title'
import Badge from '@/components/badge'
import { formatDateWithTime } from '@/utils/date'

export default function OrdersPage() {
  const orders = [
    {
      id: 102930,
      address: 'Rua Pamplona, 1593, Jardim Paulista, São Paulo, SP, CEP 01405-002',
      analyzedAt: '2025-11-21T23:30:00.000Z',
      status: 'ALL_GOOD',
    },
    {
      id: 102940,
      address: 'Rua Pamplona, 1593, Jardim Paulista, São Paulo, SP, CEP 01405-002',
      analyzedAt: '2025-11-21T12:30:00.000Z',
      status: 'PURCHASE_AND_SALE_BLOCKED',
    },
    {
      id: 102950,
      address: 'Rua das Flores, 51 – SP',
      analyzedAt: '2025-11-21T13:30:00.000Z',
      status: 'IRREGULARITIES_FOUND',
    },
    {
      id: 102930,
      address: 'Rua Pamplona, 1593, Jardim Paulista, São Paulo, SP, CEP 01405-002',
      analyzedAt: '2025-11-21T23:30:00.000Z',
      status: 'ALL_GOOD',
    },
  ]

  type BadgeStatus = 'success' | 'warning' | 'danger'

  const mapBadgeStatus: Record<string, BadgeStatus> = {
    ALL_GOOD: 'success',
    IRREGULARITIES_FOUND: 'warning',
    PURCHASE_AND_SALE_BLOCKED: 'danger',
  }

  const mapBadgeText: Record<string, string> = {
    ALL_GOOD: 'Tudo certo',
    IRREGULARITIES_FOUND: 'Irregularidades encontradas',
    PURCHASE_AND_SALE_BLOCKED: 'Impeditivo de compra e venda  ',
  }

  return (
    <div className="relative z-40 flex-1 px-4 flex flex-col gap-5 pb-24 md:pb-0">
      <TextTitle>Meus pedidos</TextTitle>

      {orders.map((order) => (
        <div
          className="flex flex-col gap-2 p-4 bg-white border-[0.5px] border-box rounded-sm"
          key={order.id}
        >
          <div className="flex text-black text-sm font-semibold leading-[130%]">
            Pedido #<p>{order.id}</p>
          </div>

          <p className="text-gray-2 text-xs font-normal leading-[130%]">{order.address}</p>
          <p className="text-gray-2 text-xs font-normal leading-[130%]">
            Analisado em {formatDateWithTime(order.analyzedAt)}
          </p>

          <Badge variant={mapBadgeStatus[order.status]}>{mapBadgeText[order.status]}</Badge>
        </div>
      ))}
    </div>
  )
}
