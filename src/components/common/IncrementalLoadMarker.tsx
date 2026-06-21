import type { RefObject } from "react";
import { Button } from "./Button";

interface IncrementalLoadMarkerProps {
  hasMoreItems: boolean;
  loadMoreMarkerRef: RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
  totalItemCount: number;
  visibleItemCount: number;
}

/**
 * Marcador reutilizable para cargar mas cards.
 * Se construye para combinar autoload por scroll y fallback por toque.
 * Lo usan feed, perfil y notificaciones.
 * Sirve para evitar listas largas renderizadas de una sola vez.
 */
export function IncrementalLoadMarker({
  hasMoreItems,
  loadMoreMarkerRef,
  onLoadMore,
  totalItemCount,
  visibleItemCount,
}: IncrementalLoadMarkerProps) {
  if (!hasMoreItems) {
    return null;
  }

  return (
    <div ref={loadMoreMarkerRef} className="flex justify-center pt-1">
      <Button className="min-h-8 px-3 text-xs" onClick={onLoadMore} variant="ghost">
        Ver más {visibleItemCount}/{totalItemCount}
      </Button>
    </div>
  );
}
