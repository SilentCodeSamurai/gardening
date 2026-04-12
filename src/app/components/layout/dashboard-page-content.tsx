import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type DashboardPageContentProps = HTMLAttributes<HTMLDivElement>;

export function DashboardPageContent({ className, ...props }: DashboardPageContentProps) {
	return <div className={cn("px-4 pt-4 pb-2", className)} {...props} />;
}
