import type { ComponentProps } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages.js";

export type PageLoadingProps = {
	/** Accessible name; defaults to `common_loading`. */
	label?: string;
	/** When false, label is only exposed to assistive tech (`sr-only`). */
	showLabel?: boolean;
	/**
	 * `page` — grows in flex layouts (full route / table body while data loads).
	 * `section` — compact block for detail subsections (linked lists, events).
	 * `inline` — centered row with vertical padding (e.g. table awaiting query).
	 */
	variant?: "page" | "section" | "inline";
} & Pick<ComponentProps<"div">, "className">;

export function PageLoading({ className, label, showLabel = true, variant = "page" }: PageLoadingProps) {
	const resolved = label ?? m.common_loading();

	return (
		<div
			role="progressbar"
			aria-live="polite"
			aria-busy={true}
			className={cn(
				"flex flex-col items-center justify-center gap-3",
				variant === "page" && "min-h-0 min-w-0 flex-1",
				variant === "section" && "w-full py-8",
				variant === "inline" && "justify-center py-12",
				className,
			)}
		>
			<Spinner className="size-8" aria-hidden />
			{showLabel ? (
				<p className="text-muted-foreground text-sm">{resolved}</p>
			) : (
				<span className="sr-only">{resolved}</span>
			)}
		</div>
	);
}
