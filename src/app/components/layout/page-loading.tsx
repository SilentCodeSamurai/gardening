import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

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
	const [showSpinner, setShowSpinner] = useState(false);

	useEffect(() => {
		const showTimeoutId = window.setTimeout(() => setShowSpinner(true), 350);
		return () => {
			window.clearTimeout(showTimeoutId);
		};
	}, []);

	return (
		<div
			aria-live="polite"
			aria-busy={true}
			className={cn(
				"flex flex-col items-center justify-center gap-3 bg-transparent",
				variant === "page" && "min-h-0 min-w-0 flex-1",
				variant === "section" && "w-full py-8",
				variant === "inline" && "justify-center py-12",
				className,
			)}
		>
			<Spinner
				aria-hidden
				className={cn("size-5 text-foreground transition-opacity duration-500", showSpinner ? "opacity-100" : "opacity-0")}
			/>
			<span className="sr-only">{showLabel ? resolved : m.common_loading()}</span>
		</div>
	);
}
