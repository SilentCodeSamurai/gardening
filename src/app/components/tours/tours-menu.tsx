import { CheckIcon, CompassIcon } from "lucide-react";
import { APP_TOUR_IDS, type AppTourId } from "@/components/tours/tour-ids";
import { getTourCopy } from "@/components/tours/tour-copy";
import { useAppTours } from "@/components/tours/app-tours-provider";
import { Button } from "@/components/ui/button";
import * as m from "@/paraglide/messages.js";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ToursMenu() {
	const { startTour, completedByTourId, activeTourId } = useAppTours();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-full justify-between gap-2 font-normal"
				>
					<span className="inline-flex items-center gap-2">
						<CompassIcon className="size-3.5 shrink-0 opacity-70" />
						{m.tours_menu_trigger()}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="z-100 w-80" align="start">
				<DropdownMenuLabel>{m.tours_menu_title()}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{APP_TOUR_IDS.map((id) => {
					const copy = getTourCopy(id);
					const completed = completedByTourId[id];
					const active = activeTourId === id;
					return (
						<DropdownMenuItem
							key={id}
							onSelect={() => startTour(id as AppTourId)}
							className="flex items-center justify-between gap-2"
						>
							<span className="truncate">{copy.name}</span>
							{active ? <span className="text-[10px] uppercase">{m.tours_status_running()}</span> : null}
							{completed ? <CheckIcon className="size-3.5 text-emerald-500" /> : null}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
