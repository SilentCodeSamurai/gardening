import { useStore } from "@tanstack/react-form";
import { useEffect, useMemo, useState } from "react";
import { SELECT_NONE } from "@/components/form/select-sentinel";
import { ItemPresentationIcon } from "@/components/icon/item-presentation-icon";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useAppForm } from "@/hooks/form";
import { normalizePresentationInput } from "@/lib/item-presentation";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages.js";
import { useLocationUpdateManyMutation } from "@/store/mutations";
import type { CachedLocation } from "@/store/query-cache-types";

type Props = {
	items: CachedLocation[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type FormValues = {
	name: string;
	iconKey: string;
	iconColor: string;
	backgroundColor: string;
};
type IncludeState = { name: boolean; iconKey: boolean; iconColor: boolean; backgroundColor: boolean };

function getCommonValue<T>(items: T[]): T | undefined {
	if (items.length === 0) return undefined;
	const first = items[0];
	if (items.every((item) => item === first)) return first;
	return undefined;
}

export function LocationUpdateManyDialog({ items, open, onOpenChange }: Props) {
	const mut = useLocationUpdateManyMutation();
	const defaultValues = useMemo<FormValues>(() => {
		const name = getCommonValue(items.map((item) => item.name)) ?? "";
		const iconKey = getCommonValue(items.map((item) => item.presentation?.iconKey ?? null));
		const iconColor = getCommonValue(items.map((item) => item.presentation?.iconColor ?? null));
		const backgroundColor = getCommonValue(items.map((item) => item.presentation?.backgroundColor ?? null));
		return {
			name,
			iconKey: iconKey ? String(iconKey) : SELECT_NONE,
			iconColor: iconColor ?? "",
			backgroundColor: backgroundColor ?? "",
		};
	}, [items]);
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			if (items.length === 0) return;
			const includePresentation = include.iconKey || include.iconColor || include.backgroundColor;
			const patch: {
				ids: CachedLocation["id"][];
				name?: string;
				presentation?: CachedLocation["presentation"];
			} = {
				ids: items.map((item) => item.id),
			};
			if (include.name) {
				const name = value.name.trim();
				if (!name) return;
				patch.name = name;
			}
			if (includePresentation) {
				patch.presentation = normalizePresentationInput({
					iconKey: value.iconKey === SELECT_NONE ? "" : value.iconKey,
					iconColor: value.iconColor,
					backgroundColor: value.backgroundColor,
				});
			}
			if (!include.name && !includePresentation) return;
			onOpenChange(false);
			await mut.mutateAsync(patch);
		},
	});
	const [include, setInclude] = useState<IncludeState>({
		name: false,
		iconKey: false,
		iconColor: false,
		backgroundColor: false,
	});

	useEffect(() => {
		if (!open) return;
		form.reset(defaultValues);
		setInclude({ name: false, iconKey: false, iconColor: false, backgroundColor: false });
	}, [defaultValues, form, open]);

	const iconColor = useStore(form.store, (state) => state.values.iconColor);
	const backgroundColor = useStore(form.store, (state) => state.values.backgroundColor);
	const close = () => onOpenChange(false);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.common_update()}</DialogTitle>
					<DialogDescription className="sr-only">{m.common_update()}</DialogDescription>
				</DialogHeader>
				<div className="grid max-h-32 gap-1 overflow-y-auto rounded-md border p-2">
					{items.map((item) => (
						<div key={String(item.id)} className="flex items-center gap-2 text-xs">
							<ItemPresentationIcon presentation={item.presentation} />
							<span className="truncate">{item.name}</span>
						</div>
					))}
				</div>
				<form.AppForm>
					<form
						id={form.formId}
						noValidate
						className="grid gap-3"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							void form.handleSubmit();
						}}
					>
						<form.AppField
							name="name"
							validators={{
								onSubmit: ({ value }) =>
									!include.name || value?.trim() ? undefined : m.fields_required(),
							}}
						>
							{(field) => (
								<div className="flex items-end gap-2">
									<div
										className={cn(
											"flex-1 rounded-md p-2",
											!include.name && "bg-muted/40 opacity-60",
											!include.name && "pointer-events-none",
										)}
									>
										<field.TextField label={m.fields_name()} placeholder={m.fields_name()} />
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="mb-2 self-end"
										onClick={() => {
											if (include.name) {
												form.setFieldValue("name", defaultValues.name);
											}
											setInclude((prev) => ({ ...prev, name: !prev.name }));
										}}
									>
										{include.name ? m.common_revert() : m.common_edit()}
									</Button>
								</div>
							)}
						</form.AppField>
						<div className="grid grid-cols-3 gap-2">
							<form.AppField name="iconKey">
								{(field) => (
									<div className="grid gap-2">
										<div
											className={cn(
												"rounded-md p-2",
												!include.iconKey && "bg-muted/40 opacity-60",
												!include.iconKey && "pointer-events-none",
											)}
										>
											<field.IconPicker
												label={m.fields_icon()}
												noneLabel={m.fields_iconNone()}
												iconColor={iconColor}
												backgroundColor={backgroundColor}
											/>
										</div>
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => {
												if (include.iconKey)
													form.setFieldValue("iconKey", defaultValues.iconKey);
												setInclude((prev) => ({ ...prev, iconKey: !prev.iconKey }));
											}}
										>
											{include.iconKey ? m.common_revert() : m.common_edit()}
										</Button>
									</div>
								)}
							</form.AppField>
							<form.AppField name="iconColor">
								{(field) => (
									<div className="grid gap-2">
										<div
											className={cn(
												"rounded-md p-2",
												!include.iconColor && "bg-muted/40 opacity-60",
												!include.iconColor && "pointer-events-none",
											)}
										>
											<field.ColorPicker label={m.fields_iconColor()} placeholder="#2f855a" />
										</div>
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => {
												if (include.iconColor)
													form.setFieldValue("iconColor", defaultValues.iconColor);
												setInclude((prev) => ({ ...prev, iconColor: !prev.iconColor }));
											}}
										>
											{include.iconColor ? m.common_revert() : m.common_edit()}
										</Button>
									</div>
								)}
							</form.AppField>
							<form.AppField name="backgroundColor">
								{(field) => (
									<div className="grid gap-2">
										<div
											className={cn(
												"rounded-md p-2",
												!include.backgroundColor && "bg-muted/40 opacity-60",
												!include.backgroundColor && "pointer-events-none",
											)}
										>
											<field.ColorPicker
												label={m.fields_backgroundColor()}
												placeholder="#e6ffed"
											/>
										</div>
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => {
												if (include.backgroundColor) {
													form.setFieldValue(
														"backgroundColor",
														defaultValues.backgroundColor,
													);
												}
												setInclude((prev) => ({
													...prev,
													backgroundColor: !prev.backgroundColor,
												}));
											}}
										>
											{include.backgroundColor ? m.common_revert() : m.common_edit()}
										</Button>
									</div>
								)}
							</form.AppField>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={close}>
								{m.common_cancel()}
							</Button>
							<form.Subscribe
								selector={(state) => ({ isSubmitting: state.isSubmitting, isDirty: state.isDirty })}
							>
								{({ isSubmitting, isDirty }) => (
									<Button
										type="submit"
										disabled={
											isSubmitting ||
											!isDirty ||
											(!include.name &&
												!include.iconKey &&
												!include.iconColor &&
												!include.backgroundColor)
										}
									>
										{m.common_save()}
									</Button>
								)}
							</form.Subscribe>
						</DialogFooter>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}
