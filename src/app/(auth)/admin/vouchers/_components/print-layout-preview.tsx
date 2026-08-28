'use client'

import type { BatchPdfPrintConfig } from '@/services/staff/voucher-print'

function previewKey(config: BatchPdfPrintConfig) {
  return config.layout === 'stacked'
    ? `stacked-${config.verso}`
    : config.duplex
}

const COPY: Record<string, { title: string; body: string }> = {
  'long-edge': {
    title: 'Duplex · virada na borda longa',
    body: 'A impressora vira a folha pela lateral. Quatro cartões por folha: frente numa página, verso na seguinte, colunas espelhadas.',
  },
  'short-edge': {
    title: 'Duplex · virada na borda curta',
    body: 'A impressora vira a folha pelo topo. Quatro cartões por folha, linhas trocadas no verso.',
  },
  'stacked-fold': {
    title: 'Empilhado · dobra',
    body: 'Duas frentes em cima, dois versos embaixo na mesma página. O verso sai girado 180° para, ao dobrar no meio, o texto ficar em pé.',
  },
  'stacked-cut': {
    title: 'Empilhado · corte',
    body: 'Duas frentes em cima, dois versos embaixo na mesma página, mesma orientação. A máquina corta na linha central.',
  },
}

function MiniCard({
  x, y, w, h, label, tone, rotate,
}: {
  x: number; y: number; w: number; h: number
  label: string; tone: 'front' | 'back'; rotate?: boolean
}) {
  const fill = tone === 'front' ? '#7132f5' : '#15204a'
  const stroke = tone === 'front' ? '#b79bff' : '#20DEFA'
  const cx = x + w / 2
  const cy = y + h / 2
  return (
    <g transform={rotate ? `rotate(180 ${cx} ${cy})` : undefined}>
      <rect x={x} y={y} width={w} height={h} rx={7} fill={fill} stroke={stroke} strokeWidth={1.6} />
      <text
        x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#fff" fontSize={13} fontWeight={800} fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    </g>
  )
}

function DuplexSvg({ axis }: { axis: 'y' | 'x' }) {
  const back = axis === 'y'
    ? ([['V2', 'V1'], ['V4', 'V3']] as const)
    : ([['V3', 'V4'], ['V1', 'V2']] as const)

  return (
    <div className={`vprint-scene vprint-flip-${axis}`}>
      <div className="vprint-sheet">
        <svg className="vprint-face vprint-front" viewBox="0 0 297 210" aria-hidden>
          <rect width="297" height="210" rx="8" fill="#0f1220" />
          <MiniCard x={12} y={14} w={132} h={86} label="F1" tone="front" />
          <MiniCard x={153} y={14} w={132} h={86} label="F2" tone="front" />
          <MiniCard x={12} y={110} w={132} h={86} label="F3" tone="front" />
          <MiniCard x={153} y={110} w={132} h={86} label="F4" tone="front" />
        </svg>
        <svg className="vprint-face vprint-back" viewBox="0 0 297 210" aria-hidden>
          <rect width="297" height="210" rx="8" fill="#0f1220" />
          <MiniCard x={12} y={14} w={132} h={86} label={back[0][0]} tone="back" />
          <MiniCard x={153} y={14} w={132} h={86} label={back[0][1]} tone="back" />
          <MiniCard x={12} y={110} w={132} h={86} label={back[1][0]} tone="back" />
          <MiniCard x={153} y={110} w={132} h={86} label={back[1][1]} tone="back" />
        </svg>
      </div>
    </div>
  )
}

function StackedSvg({ fold }: { fold: boolean }) {
  return (
    <div className={`vprint-scene ${fold ? 'vprint-folding' : 'vprint-cutting'}`}>
      <svg className="vprint-base" viewBox="0 0 297 210" aria-hidden>
        <rect width="297" height="210" rx="8" fill="#0f1220" />
        <MiniCard x={12} y={14} w={132} h={86} label="F1" tone="front" />
        <MiniCard x={153} y={14} w={132} h={86} label="F2" tone="front" />
      </svg>
      <div className="vprint-bottom">
        <svg viewBox="0 0 297 105" aria-hidden>
          <rect width="297" height="105" fill="#0f1220" />
          <MiniCard x={12} y={9} w={132} h={86} label="V1" tone="back" rotate={fold} />
          <MiniCard x={153} y={9} w={132} h={86} label="V2" tone="back" rotate={fold} />
        </svg>
      </div>
      {!fold && (
        <svg className="vprint-cut-overlay" viewBox="0 0 297 210" aria-hidden>
          <line x1="10" y1="105" x2="287" y2="105" className="vprint-cut-line" />
          <g className="vprint-blade">
            <polygon points="0,-7 16,0 0,7" fill="#e8e9f2" />
          </g>
        </svg>
      )}
    </div>
  )
}

export default function PrintLayoutPreview({ config }: { config: BatchPdfPrintConfig }) {
  const key = previewKey(config)
  const copy = COPY[key] ?? COPY['long-edge']

  return (
    <div className="overflow-hidden rounded-xl border border-[rgba(113,50,245,0.2)] bg-[#0b1b3a]">
      <style>{`
        .vprint-scene {
          position: relative;
          width: 100%;
          aspect-ratio: 297 / 210;
          perspective: 900px;
        }
        .vprint-sheet, .vprint-base, .vprint-bottom svg, .vprint-cut-overlay {
          width: 100%; height: 100%;
          display: block;
        }
        .vprint-sheet {
          position: relative;
          width: 100%; height: 100%;
          transform-style: preserve-3d;
        }
        .vprint-flip-y .vprint-sheet { animation: vprintFlipY 5.2s ease-in-out infinite; }
        .vprint-flip-x .vprint-sheet { animation: vprintFlipX 5.2s ease-in-out infinite; }
        .vprint-face {
          position: absolute; inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .vprint-back { transform: rotateY(180deg); }
        .vprint-flip-x .vprint-back { transform: rotateX(180deg); }
        .vprint-folding, .vprint-cutting { overflow: hidden; }
        .vprint-base { position: absolute; inset: 0; }
        .vprint-bottom {
          position: absolute; left: 0; right: 0; top: 50%; height: 50%;
          transform-origin: 50% 0%;
        }
        .vprint-folding .vprint-bottom {
          transform-style: preserve-3d;
          animation: vprintFold 5.2s ease-in-out infinite;
        }
        .vprint-cutting { animation: vprintSplit 5.2s ease-in-out infinite; }
        .vprint-cut-overlay { position: absolute; inset: 0; pointer-events: none; }
        .vprint-cut-line {
          stroke: #20DEFA; stroke-width: 2; stroke-dasharray: 6 5;
          animation: vprintDash 1s linear infinite;
        }
        .vprint-blade { animation: vprintBlade 5.2s ease-in-out infinite; }
        @keyframes vprintFlipY {
          0%, 28% { transform: rotateY(0deg); }
          48%, 78% { transform: rotateY(180deg); }
          100% { transform: rotateY(0deg); }
        }
        @keyframes vprintFlipX {
          0%, 28% { transform: rotateX(0deg); }
          48%, 78% { transform: rotateX(180deg); }
          100% { transform: rotateX(0deg); }
        }
        @keyframes vprintFold {
          0%, 22% { transform: rotateX(0deg); }
          48%, 72% { transform: rotateX(-170deg); }
          100% { transform: rotateX(0deg); }
        }
        @keyframes vprintSplit {
          0%, 30% { transform: translateY(0); }
          50%, 75% { transform: translateY(-3px); }
          100% { transform: translateY(0); }
        }
        @keyframes vprintDash { to { stroke-dashoffset: -22; } }
        @keyframes vprintBlade {
          0%, 12% { transform: translate(12px, 105px); }
          55%, 100% { transform: translate(270px, 105px); }
        }
      `}</style>
      <div className="p-4">
        {config.layout === 'duplex'
          ? <DuplexSvg axis={config.duplex === 'short-edge' ? 'x' : 'y'} />
          : <StackedSvg fold={config.verso === 'fold'} />}
      </div>
      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-xs font-semibold text-white">{copy.title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#c5c7d6]">{copy.body}</p>
      </div>
    </div>
  )
}
