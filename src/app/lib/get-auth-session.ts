import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { authClient } from "@/lib/auth-client";

export type AuthSessionUser = { id: string };

type SessionResult = { user: AuthSessionUser } | null;

/**
 * Client-only: layout `beforeLoad` re-runs on intent preload of *child* routes while this layout match
 * stays mounted (`preload` / `cause` stay false). Short TTL + in-flight merge avoids a `getSession`
 * network call per sidebar hover; {@link resetClientAuthSessionGuardCache} clears it when the session
 * user id changes (sign-in / sign-up / sign-out) — see `AppAuthProvider`.
 */
const clientGuardTtlMs = 120_000; // 2 minutes
let clientGuardCache: { value: SessionResult; expiresAt: number } | null = null;
let clientGuardInflight: Promise<SessionResult> | null = null;

export function resetClientAuthSessionGuardCache(): void {
	clientGuardCache = null;
	clientGuardInflight = null;
}

const resolveAuthSession = createIsomorphicFn()
	.server(async (): Promise<SessionResult> => {
		const { betterAuthBackendClient } = await import(
			"@backend/infrastructure/integrations/better-auth/client"
		);
		const headers = getRequestHeaders();
		const session = await betterAuthBackendClient.api.getSession({ headers });
		const user = session?.user;
		return user?.id != null ? { user: { id: String(user.id) } } : null;
	})
	.client(async (): Promise<SessionResult> => {
		const now = Date.now();
		if (clientGuardCache && clientGuardCache.expiresAt > now) {
			return clientGuardCache.value;
		}
		if (!clientGuardInflight) {
			clientGuardInflight = (async () => {
				const { data } = await authClient.getSession();
				const user = data?.user;
				const value: SessionResult = user?.id != null ? { user: { id: String(user.id) } } : null;
				clientGuardCache = { value, expiresAt: Date.now() + clientGuardTtlMs };
				return value;
			})().finally(() => {
				clientGuardInflight = null;
			});
		}
		return clientGuardInflight;
	});

/**
 * Session check for route guards: cookies + better-auth on the server, client session in the browser.
 */
export async function getAuthSession(): Promise<{ user: AuthSessionUser } | null> {
	return resolveAuthSession();
}
