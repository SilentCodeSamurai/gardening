import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages.js";

export type ItemNotFoundProps = {
	/** Collection or entity label (e.g. plant title message); combined with `common_notFound`. */
	resourceLabel: string;
	/**
	 * `page` — centered in flex shells (detail route early return).
	 * `inline` — text flow only (e.g. embedded in a section).
	 */
	variant?: "page" | "inline";
} & Pick<ComponentProps<"div">, "className">;

export function ItemNotFound({ resourceLabel, variant = "page", className }: ItemNotFoundProps) {
	const message = `${resourceLabel}: ${m.common_notFound()}`;

	return (
		<div
			role="alert"
			className={cn(
				"text-destructive text-sm",
				variant === "page" &&
					"flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center px-4 text-center",
				className,
			)}
		>
			{message}
		</div>
	);
}
