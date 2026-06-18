import { RefreshCw } from "lucide-react";
import type { ReactNode, TouchEvent } from "react";
import { useRef, useState } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  className?: string;
  onRefresh: () => void;
}

/**
 * Contenedor con gesto pull-to-refresh.
 * Se construye para compartir el refresco mobile entre pantallas.
 * Lo usan feed, notificaciones y perfil.
 * Sirve para sincronizar datos con un gesto familiar tipo redes sociales.
 */
export function PullToRefresh({
  children,
  className = "",
  onRefresh,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);

  /**
   * Inicia seguimiento del gesto desde el tope.
   * Se construye para evitar refrescos accidentales en medio del scroll.
   * Lo usa el evento touchstart.
   * Sirve para detectar intencion real de actualizar.
   */
  function handleTouchStart(touchEvent: TouchEvent<HTMLElement>) {
    if (window.scrollY > 0 || isRefreshing) {
      pullStartY.current = null;
      return;
    }

    pullStartY.current = touchEvent.touches[0]?.clientY ?? null;
  }

  /**
   * Mide la distancia del arrastre.
   * Se construye para mostrar feedback progresivo.
   * Lo usa el evento touchmove.
   * Sirve para que el gesto se sienta tactil sin ocupar UI fija.
   */
  function handleTouchMove(touchEvent: TouchEvent<HTMLElement>) {
    if (pullStartY.current === null || window.scrollY > 0) {
      return;
    }

    const currentTouchY = touchEvent.touches[0]?.clientY ?? pullStartY.current;
    const nextPullDistance = Math.max(0, currentTouchY - pullStartY.current);
    setPullDistance(Math.min(nextPullDistance, 96));
  }

  /**
   * Ejecuta refresco si el gesto supera el umbral.
   * Se construye para centralizar feedback y llamada de datos.
   * Lo usa touchend/touchcancel.
   * Sirve para refrescar sin botones adicionales.
   */
  function handleTouchEnd() {
    const shouldRefresh = pullDistance >= 72;
    pullStartY.current = null;
    setPullDistance(0);

    if (!shouldRefresh || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    onRefresh();
    window.setTimeout(() => setIsRefreshing(false), 650);
  }

  return (
    <section
      className={className}
      onTouchCancel={handleTouchEnd}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div
          aria-live="polite"
          className="grid place-items-center overflow-hidden transition-[height]"
          style={{ height: isRefreshing ? 44 : Math.max(24, pullDistance / 1.7) }}
        >
          <span className="grid size-9 place-items-center rounded-full bg-surface-secondary text-accent-lime shadow-floating">
            <RefreshCw
              aria-hidden="true"
              className={isRefreshing ? "animate-spin" : ""}
              size={18}
              style={{
                transform: isRefreshing
                  ? undefined
                  : `rotate(${pullDistance * 2}deg)`,
              }}
            />
          </span>
        </div>
      )}
      {children}
    </section>
  );
}
