/** Session flag: next navigation to `/` should show the public landing (skip authed → dashboard redirect). */
export const PUBLIC_HOME_INTENT_STORAGE_KEY = "gardening-public-home-intent";

/** Call before navigating to `/` from the app shell (e.g. sidebar logo) so `beforeLoad` allows the landing page. */
export function markIntentToOpenPublicHome(): void {
	if (typeof window === "undefined") return;
	try {
		sessionStorage.setItem(PUBLIC_HOME_INTENT_STORAGE_KEY, "1");
	} catch {
		// private mode / quota
	}
}

/**
 * If the user explicitly chose the public home, consume the one-shot flag and return true.
 * Safe on server (always false).
 */
export function consumeIntentToOpenPublicHome(): boolean {
	if (typeof window === "undefined") return false;
	try {
		if (sessionStorage.getItem(PUBLIC_HOME_INTENT_STORAGE_KEY) !== "1") return false;
		sessionStorage.removeItem(PUBLIC_HOME_INTENT_STORAGE_KEY);
		return true;
	} catch {
		return false;
	}
}
