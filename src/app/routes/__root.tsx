import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { AppAuthProvider } from "@/components/auth/app-auth-provider";
import { NotFoundPage } from "@/components/layout/not-found";
import { buildThemeInitScript, ThemeProvider } from "@/components/theme-provider";
import { AppToursProvider } from "@/components/tours/app-tours-provider";
import { Toaster } from "@/components/ui/sonner";
import { getLocale } from "@/paraglide/runtime";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { TooltipProvider } from "@/components/ui/tooltip";

interface MyRouterContext {
	queryClient: QueryClient;
}

const THEME_INIT_SCRIPT = buildThemeInitScript();

export const Route = createRootRouteWithContext<MyRouterContext>()({
	notFoundComponent: NotFoundPage,
	beforeLoad: async () => {
		// Other redirect strategies are possible; see
		// https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
		if (typeof document !== "undefined") {
			document.documentElement.setAttribute("lang", getLocale());
		}
	},

	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Gardening",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument() {
	return (
		<html lang={getLocale()} suppressHydrationWarning>
			<head>
				{/** biome-ignore lint/security/noDangerouslySetInnerHtml: <safe theme script> */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="wrap-anywhere font-sans antialiased selection:bg-[rgba(79,184,178,0.24)]">
				<ThemeProvider>
					<TooltipProvider>
						<AppAuthProvider>
							<AppToursProvider>
								{/* Authenticated layout sets its own h-svh/overflow; public routes (e.g. /) need to scroll. */}
								<div className="flex min-h-svh flex-col bg-background">
									<Outlet />
								</div>

								<Toaster position="top-center" richColors />

								<TanStackDevtools
									config={{
										position: "bottom-right",
									}}
									plugins={[
										{
											name: "Tanstack Router",
											render: <TanStackRouterDevtoolsPanel />,
										},
										TanStackQueryDevtools,
									]}
								/>
								<Scripts />
							</AppToursProvider>
						</AppAuthProvider>
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
