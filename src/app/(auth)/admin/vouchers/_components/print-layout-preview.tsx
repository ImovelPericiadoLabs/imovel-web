'use client'

import type { BatchPdfPrintConfig, StackedVerso } from '@/services/staff/voucher-print'

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
  'stacked-join': {
    title: 'Empilhado · junto',
    body: 'Panfleto: frente e verso do mesmo cartão formam uma peça só. O brilho fica na costura, sem linha de corte e sem giro.',
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

function PamphletColumn({ x, front, back }: { x: number; front: string; back: string }) {
  const y = 12
  const w = 132
  const h = 186
  const gid = `pamph-glow-${x}`
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A0D24" />
          <stop offset="48%" stopColor="#2A48C4" />
          <stop offset="52%" stopColor="#20DEFA" stopOpacity="0.85" />
          <stop offset="56%" stopColor="#2A48C4" />
          <stop offset="100%" stopColor="#0A0D24" />
        </linearGradient>
      </defs>
      <rect
        x={x} y={y} width={w} height={h} rx={8}
        fill={`url(#${gid})`} stroke="#7FE6FF" strokeWidth={1.6}
      />
      <ellipse className="vprint-seam" cx={x + w / 2} cy={y + h / 2} rx={w * 0.44} ry={22} fill="#20DEFA" />
      <text
        x={x + w / 2} y={y + 48} textAnchor="middle" dominantBaseline="middle"
        fill="#fff" fontSize={13} fontWeight={800} fontFamily="system-ui, sans-serif"
      >
        {front}
      </text>
      <text
        x={x + w / 2} y={y + h - 48} textAnchor="middle" dominantBaseline="middle"
        fill="#fff" fontSize={13} fontWeight={800} fontFamily="system-ui, sans-serif"
      >
        {back}
      </text>
    </g>
  )
}

function StackedSvg({ verso }: { verso: StackedVerso }) {
  if (verso === 'join') {
    return (
      <div className="vprint-scene">
        <svg className="vprint-base" viewBox="0 0 297 210" aria-hidden>
          <rect width="297" height="210" rx="8" fill="#0f1220" />
          <PamphletColumn x={12} front="F1" back="V1" />
          <PamphletColumn x={153} front="F2" back="V2" />
        </svg>
      </div>
    )
  }

  const fold = verso === 'fold'
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
        .vprint-seam { opacity: 0.42; animation: vprintSeam 2.4s ease-in-out infinite; }
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
        @keyframes vprintSeam {
          0%, 100% { opacity: 0.32; }
          50% { opacity: 0.7; }
        }
      `}</style>
      <div className="p-4">
        {config.layout === 'duplex'
          ? <DuplexSvg axis={config.duplex === 'short-edge' ? 'x' : 'y'} />
          : <StackedSvg verso={config.verso} />}
      </div>
      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-xs font-semibold text-white">{copy.title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#c5c7d6]">{copy.body}</p>
      </div>
    </div>
  )
}
