import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseIncrementalItemsInput<Item> {
  batchSize: number;
  initialVisibleCount: number;
  items: Item[];
}

/**
 * Expone una lista en tandas incrementales.
 * Se construye para evitar feeds y perfiles con listas infinitas renderizadas de golpe.
 * Lo usan pantallas con cards repetidas.
 * Sirve para cargar mas contenido cuando el usuario llega al final visible.
 */
export function useIncrementalItems<Item>({
  batchSize,
  initialVisibleCount,
  items,
}: UseIncrementalItemsInput<Item>) {
  const [visibleItemCount, setVisibleItemCount] = useState(initialVisibleCount);
  const loadMoreMarkerRef = useRef<HTMLDivElement | null>(null);
  const visibleItems = useMemo(
    () => items.slice(0, visibleItemCount),
    [items, visibleItemCount],
  );
  const hasMoreItems = visibleItemCount < items.length;

  /**
   * Incrementa la ventana visible.
   * Se construye como fallback clickeable y como callback del observador.
   * Lo usa el marcador de carga.
   * Sirve para avanzar de a pocas cards.
   */
  const loadMoreItems = useCallback(() => {
    setVisibleItemCount((currentVisibleItemCount) =>
      Math.min(currentVisibleItemCount + batchSize, items.length),
    );
  }, [batchSize, items.length]);

  useEffect(() => {
    setVisibleItemCount(Math.min(initialVisibleCount, items.length));
  }, [initialVisibleCount, items]);

  useEffect(() => {
    if (!hasMoreItems) {
      return;
    }

    const loadMoreMarker = loadMoreMarkerRef.current;

    if (!loadMoreMarker || !("IntersectionObserver" in window)) {
      return;
    }

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((intersectionEntry) => intersectionEntry.isIntersecting)
        ) {
          loadMoreItems();
        }
      },
      {
        rootMargin: "240px 0px",
      },
    );

    intersectionObserver.observe(loadMoreMarker);

    return () => {
      intersectionObserver.disconnect();
    };
  }, [hasMoreItems, loadMoreItems, visibleItemCount]);

  return {
    hasMoreItems,
    loadMoreItems,
    loadMoreMarkerRef,
    totalItemCount: items.length,
    visibleItemCount: visibleItems.length,
    visibleItems,
  };
}
