import { AuthUIContext } from "@daveyplate/better-auth-ui";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { type ReactNode, useContext, useEffect, useRef } from "react";

import { authClient } from "@/lib/auth-client";
import { resetClientAuthSessionGuardCache } from "@/lib/get-auth-session";

function clientBaseUrl(): string | undefined {
	if (typeof window === "undefined") return undefined;
	return window.location.origin;
}

/**
 * {@link https://better-auth-ui.com/advanced/organizations#organizationswitcher OrganizationSwitcher}
 * updates the active organization but does not run the provider's `onSessionChange` callback
 * (unlike multi-session account switching). Invalidate the full TanStack Query cache whenever
 * the active organization id changes so org-scoped API data cannot leak across tenants.
 */
function OnActiveOrganizationChange() {
	const router = useRouter();
	const { hooks } = useContext(AuthUIContext);
	const { data: activeOrganization, isPending: activeOrganizationPending } = hooks.useActiveOrganization();
	const activeOrganizationId = activeOrganization?.id ?? null;
	const queryClient = useQueryClient();
	const previousOrganizationId = useRef<string | null | undefined>(undefined);

	useEffect(() => {
		if (activeOrganizationPending) return;
		if (previousOrganizationId.current === undefined) {
			previousOrganizationId.current = activeOrganizationId;
			return;
		}
		if (previousOrganizationId.current !== activeOrganizationId) {
			previousOrganizationId.current = activeOrganizationId;
			queryClient.invalidateQueries();
			router.navigate({ to: "/dashboard" });
		}
	}, [activeOrganizationId, activeOrganizationPending, queryClient, router]);

	return null;
}

/**
 * Route guard uses a short client session cache in {@link getAuthSession}. Clear it whenever the
 * signed-in user id changes so sign-in / sign-up / sign-out all see a fresh `getSession` on the next
 * `beforeLoad` (otherwise a cached `null` after sign-up redirects to sign-in until full reload).
 */
function ResetAuthGuardCacheOnSessionUserChange() {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;
	const previousUserId = useRef<string | undefined>(undefined);
	const isFirstRun = useRef(true);

	useEffect(() => {
		if (isFirstRun.current) {
			isFirstRun.current = false;
			previousUserId.current = userId;
			return;
		}
		if (previousUserId.current !== userId) {
			resetClientAuthSessionGuardCache();
			previousUserId.current = userId;
		}
	}, [userId]);

	return null;
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
	const navigate = useNavigate();

	return (
		<AuthUIProviderTanstack
			authClient={authClient}
			baseURL={clientBaseUrl()}
			redirectTo="/dashboard"
			navigate={(href) => {
				void navigate({ to: href });
			}}
			replace={(href) => {
				void navigate({ to: href, replace: true });
			}}
			Link={({ href, className, children: linkChildren }) => (
				<Link to={href} className={className}>
					{linkChildren}
				</Link>
			)}
			organization={{
				personalPath: "/dashboard",
			}}
			account
		>
			<OnActiveOrganizationChange />
			<ResetAuthGuardCacheOnSessionUserChange />
			{children}
		</AuthUIProviderTanstack>
	);
}
