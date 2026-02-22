import OrdersPageClient from './orders-page-client'

export default function consultasPage() {
  return (
    <>
      <div className="relative bg-primary h-30 -mt-1"></div>
      <main className="w-full mx-auto lg:max-w-lg pt-5 px-0 -mt-36">
        <OrdersPageClient />
      </main>
    </>
  )
}
