/**
 * Logo « Intent » — boussole minimale : une aiguille (losange) pointant vers le haut,
 * évoquant l'orientation de ses dépenses / le choix conscient.
 * Carré arrondi en dégradé ING, glyphe blanc. Net à toute taille.
 */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl brand-gradient text-white shadow-soft"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        {/* Aiguille de boussole : losange, moitié haute pleine, moitié basse en contour. */}
        <path d="M12 2 L16 12 L12 9.5 L8 12 Z" fill="white" />
        <path d="M12 22 L8 12 L12 14.5 L16 12 Z" fill="white" fillOpacity="0.45" />
      </svg>
    </span>
  )
}
