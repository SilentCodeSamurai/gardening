import { OrganizationSwitcher } from "@daveyplate/better-auth-ui";
import type { ReactNode } from "react";
import { CollectionIcon, type GardeningCollectionKey } from "@/components/icon/collection-icon";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

type DashboardPageHeadingProps = {
	className?: string;
	triggerClassName?: string;
	collection?: GardeningCollectionKey;
	children: ReactNode;
};

export function DashboardPageHeading({ className, triggerClassName, collection, children }: DashboardPageHeadingProps) {
	return (
		<>
			<div className={cn("flex min-w-0 items-center gap-1 py-1 pl-1", className)}>
				<SidebarTrigger className={cn("shrink-0", triggerClassName)} />
				<Separator orientation="vertical" />
				<OrganizationSwitcher
					size="sm"
					className="w-50 border border-border bg-input/20 text-foreground hover:bg-input/50 hover:text-foreground"
				/>
				<div className="ml-1 flex items-center gap-2">
					{collection ? <CollectionIcon collection={collection} className="size-5" /> : null}
					{children}
				</div>
			</div>
			<Separator orientation="horizontal" className="w-full" />
		</>
	);
}
