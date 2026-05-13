import { useSyncExternalStore } from "react";

/**
 * When true, attach the platform's native `title` attribute to controls for hover hints.
 * False on touch-primary UIs (`hover: none`) where Radix-style tooltips are disabled anyway.
 */
export function useNativeHoverTitleHints(): boolean {
	return useSyncExternalStore(
		(onStoreChange) => {
			if (typeof window === "undefined") return () => {};
			const mq = window.matchMedia("(hover: hover)");
			mq.addEventListener("change", onStoreChange);
			return () => mq.removeEventListener("change", onStoreChange);
		},
		() => window.matchMedia("(hover: hover)").matches,
		() => false,
	);
}
