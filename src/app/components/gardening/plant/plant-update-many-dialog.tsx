import type { CultivarEntityId } from "@backend/core/domain/gardening/entities";
import type { ItemPresentationValueObject } from "@backend/core/domain/gardening/value-objects";
import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SELECT_NONE } from "@/components/form/select-sentinel";
import { getPlantDisplayTitle } from "@/components/gardening/plant/plant-list-card";
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
import { queryKeys } from "@/store/keys";
import { usePlantUpdateManyMutation } from "@/store/mutations";
import type { CachedCultivar, CachedHydratedPlant } from "@/store/query-cache-types";

type Props = {
	items: CachedHydratedPlant[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type FormValues = {
	cultivarId: string;
	title: string;
	description: string;
	iconKey: string;
	iconColor: string;
	backgroundColor: string;
};
type IncludeState = {
	cultivarId: boolean;
	title: boolean;
	description: boolean;
	iconKey: boolean;
	iconColor: boolean;
	backgroundColor: boolean;
};

function getCommonValue<T>(items: T[]): T | undefined {
	if (items.length === 0) return undefined;
	const first = items[0];
	if (items.every((item) => item === first)) return first;
	return undefined;
}

function toPresentationFields(
	presentation: ItemPresentationValueObject | null,
): Pick<FormValues, "iconKey" | "iconColor" | "backgroundColor"> {
	return {
		iconKey: presentation?.iconKey ? String(presentation.iconKey) : SELECT_NONE,
		iconColor: presentation?.iconColor ?? "",
		backgroundColor: presentation?.backgroundColor ?? "",
	};
}

function PlantUpdateManyDialogContent({
	items,
	open,
	onOpenChange,
	cultivarItems,
}: Props & { cultivarItems: CachedCultivar[] }) {
	const mut = usePlantUpdateManyMutation();
	const cultivarOptions = useMemo(
		() =>
			cultivarItems.map((c) => ({
				value: String(c.id),
				label: c.characteristics.name,
				presentation: c.presentation,
			})),
		[cultivarItems],
	);
	const defaultValues = useMemo<FormValues>(() => {
		const cultivarId = getCommonValue(items.map((item) => item.cultivarId ?? null));
		const title = getCommonValue(items.map((item) => item.title ?? null));
		const description = getCommonValue(items.map((item) => item.description ?? null));
		const iconKey = getCommonValue(items.map((item) => item.presentation?.iconKey ?? null));
		const iconColor = getCommonValue(items.map((item) => item.presentation?.iconColor ?? null));
		const backgroundColor = getCommonValue(items.map((item) => item.presentation?.backgroundColor ?? null));
		return {
			cultivarId: cultivarId ? String(cultivarId) : SELECT_NONE,
			title: title ?? "",
			description: description ?? "",
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
				ids: CachedHydratedPlant["id"][];
				cultivarId?: CultivarEntityId | null;
				title?: string | null;
				description?: string | null;
				presentation?: CachedHydratedPlant["presentation"];
			} = { ids: items.map((item) => item.id) };
			if (include.cultivarId) {
				patch.cultivarId = value.cultivarId === SELECT_NONE ? null : (value.cultivarId as CultivarEntityId);
			}
			if (include.title) patch.title = value.title.trim() || null;
			if (include.description) patch.description = value.description.trim() || null;
			if (includePresentation) {
				patch.presentation = normalizePresentationInput({
					iconKey: value.iconKey === SELECT_NONE ? "" : value.iconKey,
					iconColor: value.iconColor,
					backgroundColor: value.backgroundColor,
				});
			}
			if (!include.cultivarId && !include.title && !include.description && !includePresentation) return;
			onOpenChange(false);
			await mut.mutateAsync(patch);
		},
	});
	const [include, setInclude] = useState<IncludeState>({
		cultivarId: false,
		title: false,
		description: false,
		iconKey: false,
		iconColor: false,
		backgroundColor: false,
	});
	useEffect(() => {
		if (!open) return;
		form.reset(defaultValues);
		setInclude({
			cultivarId: false,
			title: false,
			description: false,
			iconKey: false,
			iconColor: false,
			backgroundColor: false,
		});
	}, [defaultValues, form, open]);

	const iconColor = useStore(form.store, (state) => state.values.iconColor);
	const backgroundColor = useStore(form.store, (state) => state.values.backgroundColor);
	const selectedCultivarId = useStore(form.store, (state) => state.values.cultivarId);
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
							<span className="truncate">{getPlantDisplayTitle(item)}</span>
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
						<form.AppField name="cultivarId">
							{(field) => (
								<div className="flex items-end gap-2">
									<div
										className={cn(
											"flex-1 rounded-md p-2",
											!include.cultivarId && "pointer-events-none bg-muted/40 opacity-60",
										)}
									>
										<field.CatalogCombobox
											label={m.collections_cultivar_title()}
											placeholder={m.fields_selectPlaceholder()}
											emptyLabel={m.filtering_comboboxEmpty()}
											values={cultivarOptions}
										/>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="mb-2 self-end"
										onClick={() => {
											if (include.cultivarId)
												form.setFieldValue("cultivarId", defaultValues.cultivarId);
											setInclude((prev) => ({ ...prev, cultivarId: !prev.cultivarId }));
										}}
									>
										{include.cultivarId ? m.common_revert() : m.common_edit()}
									</Button>
								</div>
							)}
						</form.AppField>
						<form.AppField name="title">
							{(field) => (
								<div className="flex items-end gap-2">
									<div
										className={cn(
											"flex-1 rounded-md p-2",
											!include.title && "pointer-events-none bg-muted/40 opacity-60",
										)}
									>
										<field.TextField label={m.fields_title()} placeholder={m.fields_title()} />
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="mb-2 self-end"
										onClick={() => {
											if (include.title) form.setFieldValue("title", defaultValues.title);
											setInclude((prev) => ({ ...prev, title: !prev.title }));
										}}
									>
										{include.title ? m.common_revert() : m.common_edit()}
									</Button>
								</div>
							)}
						</form.AppField>
						<form.AppField name="description">
							{(field) => (
								<div className="flex items-end gap-2">
									<div
										className={cn(
											"flex-1 rounded-md p-2",
											!include.description && "pointer-events-none bg-muted/40 opacity-60",
										)}
									>
										<field.TextField
											label={m.fields_description()}
											placeholder={m.fields_description()}
										/>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="mb-2 self-end"
										onClick={() => {
											if (include.description)
												form.setFieldValue("description", defaultValues.description);
											setInclude((prev) => ({ ...prev, description: !prev.description }));
										}}
									>
										{include.description ? m.common_revert() : m.common_edit()}
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
												!include.iconKey && "pointer-events-none bg-muted/40 opacity-60",
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
												!include.iconColor && "pointer-events-none bg-muted/40 opacity-60",
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
												!include.backgroundColor &&
													"pointer-events-none bg-muted/40 opacity-60",
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
												if (include.backgroundColor)
													form.setFieldValue(
														"backgroundColor",
														defaultValues.backgroundColor,
													);
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
						<div className="flex justify-end">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={selectedCultivarId === SELECT_NONE}
								onClick={() => {
									const cultivar = cultivarItems.find(
										(item) => String(item.id) === selectedCultivarId,
									);
									const next = toPresentationFields(cultivar?.presentation ?? null);
									form.setFieldValue("iconKey", next.iconKey);
									form.setFieldValue("iconColor", next.iconColor);
									form.setFieldValue("backgroundColor", next.backgroundColor);
								}}
							>
								{m.collections_selectFromCultivar()}
							</Button>
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
											(!include.cultivarId &&
												!include.title &&
												!include.description &&
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

export function PlantUpdateManyDialog({ items, open, onOpenChange }: Props) {
	const { data: cultivarData } = useQuery({ ...queryKeys.cultivar.all });
	return (
		<PlantUpdateManyDialogContent
			items={items}
			open={open}
			onOpenChange={onOpenChange}
			cultivarItems={cultivarData?.items ?? []}
		/>
	);
}
