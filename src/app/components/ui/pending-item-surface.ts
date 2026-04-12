import { cn } from "@/lib/utils";

/**
 * Shared look for optimistic / not-yet-synced list rows and cards: `accent` tint + left bar, breathe animation
 * (see `.animate-pending-breathe` in `styles.css` — uses `var(--accent)`). Use with
 * `className={cn(..., syncPending && pendingItemSurfaceClassName)}`.
 *
 * `!transition-none`: `transition-colors` on rows/cards otherwise fights the keyframed background and flickers.
 */
export const pendingItemSurfaceClassName = cn(
	"animate-pending-breathe",
	"!transition-none",
	"border-l-[3px] border-l-accent",
);
