import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { DashboardSidebar } from "#/app/components/layout/dashboard-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAuthSession } from "@/lib/get-auth-session";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages.js";

const LIST_FULL_HEIGHT_PATHNAMES = new Set([
	"/plants",
	"/locations",
	"/gardening-events",
	"/catalog/species",
	"/catalog/cultivars",
	"/catalog/species-categories",
]);

/** Pathnames where the main column should fill the viewport (no outer scroll); child regions handle overflow. */
function isMainColumnFullHeightPathname(pathname: string): boolean {
	if (LIST_FULL_HEIGHT_PATHNAMES.has(pathname)) return true;
	return /^\/location\/[^/]+\/layout$/.test(pathname);
}

function MainOutletShell({ children }: { children: ReactNode }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const listFullHeight = isMainColumnFullHeightPathname(pathname);
	return (
		<div
			className={cn(
				"flex min-h-0 flex-1 flex-col",
				listFullHeight ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden",
			)}
		>
			{children}
		</div>
	)
}

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ location, cause, preload }) => {
		// Intent preload: `cause === `preload`` / `preload` when the match is not yet active.
		// When preloading a *child* while already under this layout, TanStack keeps the parent match in
		// `matchStores`, so both flags are often false — `getAuthSession` is deduped briefly on the client
		// (see `get-auth-session.ts`) and `defaultPreloadStaleTime` limits repeat preloads.
		if (preload || cause === "preload") {
			return
		}
		const session = await getAuthSession();
		if (!session) {
			throw redirect({
				to: "/auth/$authView",
				params: { authView: "sign-in" },
				search: { redirect: location.pathname },
			})
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return (
		<SidebarProvider className="h-svh max-h-svh overflow-hidden bg-background">
			<DashboardSidebar />
			<SidebarInset
				id="main-content"
				aria-label={m.components_layout_appShell_mainLabel()}
				className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
			>
				<MainOutletShell>
					<Outlet />
				</MainOutletShell>
			</SidebarInset>
		</SidebarProvider>
	)
}
