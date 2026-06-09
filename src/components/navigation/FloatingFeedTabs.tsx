import type { FeedTabIdentifier } from "../../domain/enums/postEnums";

interface FloatingFeedTabsProps {
  activeTab: FeedTabIdentifier;
  onTabChange: (feedTabIdentifier: FeedTabIdentifier) => void;
}

const feedTabs: Array<{
  identifier: FeedTabIdentifier;
  label: string;
}> = [
  {
    identifier: "community",
    label: "Comunidad",
  },
  {
    identifier: "following",
    label: "Siguiendo",
  },
];

/**
 * Tabs flotantes principales del feed.
 * Se construye para respetar la referencia TikTok con navegacion minima.
 * Lo usa App y luego lo usaran las rutas de feed.
 * Sirve para alternar entre comunidad publica y contenido seguido.
 */
export function FloatingFeedTabs({
  activeTab,
  onTabChange,
}: FloatingFeedTabsProps) {
  return (
    <nav
      aria-label="Feeds principales"
      className="fixed left-1/2 top-3 z-20 flex -translate-x-1/2 rounded-full border border-border-subtle bg-surface-primary/90 p-1 shadow-floating backdrop-blur"
    >
      {feedTabs.map((feedTab) => {
        const isActiveFeedTab = feedTab.identifier === activeTab;

        return (
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActiveFeedTab
                ? "bg-accent-lime text-background-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
            key={feedTab.identifier}
            onClick={() => onTabChange(feedTab.identifier)}
            type="button"
          >
            {feedTab.label}
          </button>
        );
      })}
    </nav>
  );
}
