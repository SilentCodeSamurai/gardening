import { ChevronDownIcon, MoonIcon, SunIcon } from "lucide-react";
import { type Theme, useTheme } from "@/components/theme-provider";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as m from "@/paraglide/messages.js";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-full justify-between gap-2 font-normal"
					aria-label={m.components_layout_theme_toggleAria()}
					id="theme-toggle-trigger"
				>
					<span className="flex items-center gap-2">
						<SunIcon className="size-3.5 shrink-0 opacity-70 dark:hidden" />
						<MoonIcon className="hidden size-3.5 shrink-0 opacity-70 dark:inline" />
						{m.components_layout_theme_toggleAria()}
					</span>
					<ChevronDownIcon className="size-3.5 shrink-0 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="z-100 w-(--radix-dropdown-menu-trigger-width)" align="start">
				<DropdownMenuLabel>{m.components_layout_theme_toggleAria()}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
					<DropdownMenuRadioItem value="light">
						{m.components_layout_theme_light()}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="dark">
						{m.components_layout_theme_dark()}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="system">
						{m.components_layout_theme_system()}
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
