import { ChevronDownIcon, LanguagesIcon } from "lucide-react";
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
import { getLocale, type Locale, setLocale } from "@/paraglide/runtime";

export function SidebarLanguageMenu() {
	const current = getLocale();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-full justify-between gap-2 font-normal"
					aria-label={m.components_layout_lang_menuTriggerAria()}
				>
					<span className="flex items-center gap-2">
						<LanguagesIcon className="size-3.5 shrink-0 opacity-70" />
						{current === "de"
							? m.components_layout_lang_de()
							: current === "ru"
								? m.components_layout_lang_ru()
								: m.components_layout_lang_en()}
					</span>
					<ChevronDownIcon className="size-3.5 shrink-0 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="z-100 w-(--radix-dropdown-menu-trigger-width)" align="start">
				<DropdownMenuLabel>{m.components_layout_lang_groupAria()}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup value={current} onValueChange={(code) => void setLocale(code as Locale)}>
					<DropdownMenuRadioItem value="en">{m.components_layout_lang_en()}</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="de">{m.components_layout_lang_de()}</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="ru">{m.components_layout_lang_ru()}</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
