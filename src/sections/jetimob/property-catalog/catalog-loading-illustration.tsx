/**
 * Ilustração SVG animada para o carregamento inicial do catálogo — substitui um
 * spinner genérico por algo que comunica "varrendo sua carteira de imóveis".
 * Animação via CSS (globals.css: jetimob-scan-sweep/jetimob-scan-pulse), sem JS.
 */
export function CatalogLoadingIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      className={className}
      role="img"
      aria-label="Carregando catálogo de imóveis"
    >
      <defs>
        <clipPath id="jetimob-scan-clip">
          <rect x="24" y="28" width="112" height="72" rx="8" />
        </clipPath>
        <linearGradient id="jetimob-scan-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Prédio estilizado */}
      <rect
        x="24"
        y="28"
        width="112"
        height="72"
        rx="8"
        className="fill-primary/5 stroke-primary/30"
        strokeWidth="2"
      />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={38 + col * 22}
            y={42 + row * 18}
            width="12"
            height="10"
            rx="2"
            className="fill-primary/20"
          />
        )),
      )}

      {/* Varredura animada, recortada nos limites do prédio */}
      <g clipPath="url(#jetimob-scan-clip)">
        <rect
          x="24"
          y="28"
          width="112"
          height="40"
          fill="url(#jetimob-scan-gradient)"
          className="jetimob-scan-sweep text-primary"
        />
      </g>

      {/* Base/terreno */}
      <line x1="12" y1="104" x2="148" y2="104" className="stroke-gray-200" strokeWidth="3" strokeLinecap="round" />

      {/* Pulso de "localização encontrada" */}
      <circle cx="132" cy="30" r="5" className="jetimob-scan-pulse fill-emerald-400" />
    </svg>
  )
}
