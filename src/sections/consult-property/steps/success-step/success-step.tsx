import { Check, Cpu, MessageCircle, FileSearch, ShieldCheck } from 'lucide-react'
import Button from '@/components/button'
import { IncludedCertificatesPanel } from '@/components/included-certificates/included-certificates-panel'
import { trackGtmEvent } from '@/utils/analytics/gtm'

interface SuccessStepProps {
  onNavigateToOrders: () => void
}

export function SuccessStep({ onNavigateToOrders }: SuccessStepProps) {
  return (
    <div className="w-full px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-8">
      <div className="bg-white rounded-3xl p-6 pt-12 pb-8 shadow-xl relative flex flex-col items-center text-center mt-6 border border-gray-100">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl opacity-70"></div>
            <div className="relative size-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
              <Check className="text-white size-10 stroke-[3]" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
          Pagamento recebido!
        </h2>

        <p className="text-gray-600 text-sm max-w-[280px] leading-relaxed">
          Seu pagamento foi confirmado. <span className="font-semibold text-emerald-600">já estamos cuidando da segurança</span> do seu negócio imobiliário.
        </p>

        <div className="w-full h-px bg-gray-100 my-6"></div>

        <div className="w-full text-left">
          <h3 className="text-gray-900 font-semibold text-base mb-6 pl-1">
            O que acontece agora?
          </h3>

          <div className="relative space-y-8 pl-4 before:absolute before:left-[23px] before:top-2 before:h-[calc(100%-20px)] before:w-0.5 before:bg-gray-100">
            <div className="relative flex gap-4 items-start">
              <div className="z-10 relative flex-shrink-0 size-10 bg-emerald-500 border-2 border-emerald-500/20 rounded-full flex items-center justify-center">
                <Cpu className="size-5 text-white" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-semibold text-emerald-700 text-sm">Nossa IA entrou em ação</span>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Iniciamos o cruzamento de dados e a varredura jurídica do imóvel imediatamente.
                </p>
              </div>
            </div>

            <div className="relative flex gap-4 items-start">
              <div className="z-10 relative flex-shrink-0 size-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <ShieldCheck className="size-5 text-emerald-600" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-medium text-gray-700 text-sm">Certidões oficiais em emissão</span>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  CND Federal, Trabalhista, Estadual, FGTS, CNJ, CGU, ônus e IPTU (quando aplicável) entram no seu relatório.
                </p>
              </div>
            </div>

            <div className="relative flex gap-4 items-start">
              <div className="z-10 relative flex-shrink-0 size-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <MessageCircle className="size-5 text-gray-400" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-medium text-gray-700 text-sm">Mantemos você informado</span>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Qualquer novidade ou pendência, avisaremos você via WhatsApp na hora.
                </p>
              </div>
            </div>

            <div className="relative flex gap-4 items-start">
              <div className="z-10 relative flex-shrink-0 size-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <FileSearch className="size-5 text-gray-400" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-medium text-gray-700 text-sm">Seu laudo detalhado</span>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Ao final, você terá análise + certidões em PDF disponíveis na plataforma.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <IncludedCertificatesPanel />
          </div>
        </div>
      </div>

      <div className="w-full mt-6">
        <Button
          onClick={() => {
            trackGtmEvent('orders_navigation_click', {
              event_category: 'success',
              event_label: 'navigate_orders',
              event_description: 'Usuário clicou para acompanhar suas consultas.',
            })
            onNavigateToOrders()
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 transition-all active:scale-[0.98] rounded-full"
        >
          Acompanhar minhas consultas
        </Button>
      </div>
    </div>
  )
}
