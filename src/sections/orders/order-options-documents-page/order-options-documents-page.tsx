import OrderHeader from '@/sections/orders/order-header'
import BadgeComponent from '@/components/badge'

export default function OrderOptionsDocumentsPage() {
  return (
    <div className="flex flex-col gap-3">
      <OrderHeader Badge={<BadgeComponent variant="danger">Sinal Vermelho</BadgeComponent>} />
    </div>
  )
}
