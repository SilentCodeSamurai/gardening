import type { NotFoundRouteProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import * as m from "@/paraglide/messages.js";

export function NotFoundPage(_props: NotFoundRouteProps) {
	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
			<div className="space-y-2">
				<h1 className="font-semibold text-2xl text-foreground tracking-tight">{m.layout_notFound_title()}</h1>
				<p className="max-w-md text-muted-foreground text-sm">{m.layout_notFound_description()}</p>
			</div>
			<Button asChild variant="secondary">
				<Link to="/">{m.layout_notFound_goHome()}</Link>
			</Button>
		</main>
	);
}
