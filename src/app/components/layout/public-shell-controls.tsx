import { LanguagesIcon, MoonIcon, SunIcon } from "lucide-react";
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
import { getLocale, type Locale, setLocale } from "@/paraglide/runtime";

/** Icon-only theme menu for public routes (landing, auth shell). */
export function PublicThemeMenu() {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="shrink-0 border-border/80 bg-background/60 backdrop-blur-sm"
					aria-label={m.components_layout_theme_toggleAria()}
				>
					<SunIcon className="size-4 dark:hidden" />
					<MoonIcon className="hidden size-4 dark:inline" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="z-100 min-w-40" align="end">
				<DropdownMenuLabel>{m.components_layout_theme_toggleAria()}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
					<DropdownMenuRadioItem value="light">{m.components_layout_theme_light()}</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="dark">{m.components_layout_theme_dark()}</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="system">{m.components_layout_theme_system()}</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Icon-only language menu for public routes. */
export function PublicLanguageMenu() {
	const current = getLocale();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="shrink-0 border-border/80 bg-background/60 backdrop-blur-sm"
					aria-label={m.components_layout_lang_menuTriggerAria()}
				>
					<LanguagesIcon className="size-4 opacity-90" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="z-100 min-w-40" align="end">
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

/** Theme + locale controls for minimal public headers. */
export function PublicShellControls({ className }: { className?: string }) {
	return (
		<div className={className ?? "flex items-center gap-2"}>
			<PublicLanguageMenu />
			<PublicThemeMenu />
		</div>
	);
}
