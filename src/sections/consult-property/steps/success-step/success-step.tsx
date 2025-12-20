import { Check, Cpu, MessageCircle, FileSearch, ShieldCheck } from 'lucide-react'
import Button from '@/components/button'

interface SuccessStepProps {
  onNavigateToOrders: () => void
}

export function SuccessStep({ onNavigateToOrders }: SuccessStepProps) {
  return (
    <div className="w-full px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-8">
      
      {/* CARD PRINCIPAL */}
      <div className="bg-white rounded-3xl p-6 pt-12 pb-8 shadow-xl relative flex flex-col items-center text-center mt-6">
        
        {/* Ícone Hero */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
            <div className="relative size-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="text-white size-10 stroke-[3]" />
            </div>
          </div>
        </div>
        
        {/* Título de Gratidão */}
        <h2 className="text-2xl font-bold text-dark mt-4 mb-2">
          Pagamento recebido!
        </h2>
        
        {/* Texto de Confiança e Segurança */}
        <p className="text-gray-500 text-sm max-w-[280px] leading-relaxed">
          Seu pagamento foi confirmado. <span className="font-semibold text-emerald-700">já estamos cuidando da segurança</span> do seu negócio imobiliário.
        </p>


        <div className="w-full h-px bg-gray-100 my-6"></div>

        {/* Timeline Humanizada */}
        <div className="w-full text-left">
          <h3 className="text-dark font-semibold text-base mb-6 pl-1">
            O que acontece agora?
          </h3>

          <div className="relative space-y-8 pl-4 before:absolute before:left-[23px] before:top-2 before:h-[calc(100%-20px)] before:w-0.5 before:bg-gray-100">
            
            {/* Passo 1 - Tecnologia trabalhando */}
            <div className="relative flex gap-4 items-start">
              <div className="z-10 relative flex-shrink-0 size-10 bg-emerald-50 border-2 border-emerald-500 rounded-full flex items-center justify-center">
                <Cpu className="size-5 text-emerald-600" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-semibold text-emerald-900 text-sm">Nossa IA entrou em ação</span>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Iniciamos o cruzamento de dados e a varredura jurídica do imóvel imediatamente.
                </p>
              </div>
            </div>

            {/* Passo 2 - Transparência */}
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

            {/* Passo 3 - Resultado */}
            <div className="relative flex gap-4 items-start">
              <div className="z-10 relative flex-shrink-0 size-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <FileSearch className="size-5 text-gray-400" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-medium text-gray-700 text-sm">Seu laudo detalhado</span>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Ao final, você terá um relatório completo disponível aqui na plataforma.
                </p>
              </div>
            </div>

          </div>
        </div>
        
      </div>

      {/* BOTÃO FORA DA BOX */}
      <div className="w-full mt-6">
        <Button 
          onClick={onNavigateToOrders} 
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 transition-all active:scale-[0.98]"
        >
          Acompanhar minhas consultas
        </Button>
      </div>

    </div>
  )
}