import type { SpeciesCategoryEntityId } from "@backend/core/domain/gardening/entities";
import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
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
import { translateCatalogField } from "@/lib/translate-catalog-field";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages.js";
import { queryKeys } from "@/store/keys";
import { useSpeciesUpdateManyMutation } from "@/store/mutations";
import type { CachedSpeciesWithSystemCatalog } from "@/store/query-cache-types";

type Props = {
	items: CachedSpeciesWithSystemCatalog[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type FormValues = {
	categoryId: string;
	name: string;
	description: string;
	iconKey: string;
	iconColor: string;
	backgroundColor: string;
};
type IncludeState = {
	categoryId: boolean;
	name: boolean;
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

function toPresentationFields(presentation: CachedSpeciesWithSystemCatalog["presentation"]) {
	return {
		iconKey: presentation?.iconKey ? String(presentation.iconKey) : SELECT_NONE,
		iconColor: presentation?.iconColor ?? "",
		backgroundColor: presentation?.backgroundColor ?? "",
	};
}

export function SpeciesUpdateManyDialog({ items, open, onOpenChange }: Props) {
	const { data: catData } = useQuery({ ...queryKeys.speciesCategory.all });
	const mut = useSpeciesUpdateManyMutation();

	const categoryOptions = useMemo(() => {
		const categories = catData?.items ?? [];
		return categories.map((c) => ({
			value: String(c.id),
			label: translateCatalogField(c.title, c.systemCatalog) ?? String(c.id),
			presentation: c.presentation,
		}));
	}, [catData?.items]);
	const defaultValues = useMemo<FormValues>(() => {
		const categoryId = getCommonValue(items.map((item) => item.categoryId ?? null));
		const name = getCommonValue(items.map((item) => item.characteristics.name)) ?? "";
		const description = getCommonValue(items.map((item) => item.characteristics.description ?? null));
		const iconKey = getCommonValue(items.map((item) => item.presentation?.iconKey ?? null));
		const iconColor = getCommonValue(items.map((item) => item.presentation?.iconColor ?? null));
		const backgroundColor = getCommonValue(items.map((item) => item.presentation?.backgroundColor ?? null));
		return {
			categoryId: categoryId ? String(categoryId) : SELECT_NONE,
			name,
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
			const includeCharacteristics = include.name || include.description;
			const patch: {
				ids: CachedSpeciesWithSystemCatalog["id"][];
				categoryId?: SpeciesCategoryEntityId | null;
				characteristics?: CachedSpeciesWithSystemCatalog["characteristics"];
				presentation?: CachedSpeciesWithSystemCatalog["presentation"];
			} = { ids: items.map((item) => item.id) };
			if (include.categoryId) {
				patch.categoryId =
					value.categoryId === SELECT_NONE ? null : (value.categoryId as SpeciesCategoryEntityId);
			}
			if (includeCharacteristics) {
				const name = value.name.trim();
				if (!name) return;
				patch.characteristics = {
					name,
					description: value.description.trim() || null,
				};
			}
			if (includePresentation) {
				patch.presentation = normalizePresentationInput({
					iconKey: value.iconKey === SELECT_NONE ? "" : value.iconKey,
					iconColor: value.iconColor,
					backgroundColor: value.backgroundColor,
				});
			}
			if (!include.categoryId && !includeCharacteristics && !includePresentation) return;
			onOpenChange(false);
			await mut.mutateAsync(patch);
		},
	});
	const [include, setInclude] = useState<IncludeState>({
		categoryId: false,
		name: false,
		description: false,
		iconKey: false,
		iconColor: false,
		backgroundColor: false,
	});

	useEffect(() => {
		if (!open) return;
		form.reset(defaultValues);
		setInclude({
			categoryId: false,
			name: false,
			description: false,
			iconKey: false,
			iconColor: false,
			backgroundColor: false,
		});
	}, [defaultValues, form, open]);

	const iconColor = useStore(form.store, (state) => state.values.iconColor);
	const backgroundColor = useStore(form.store, (state) => state.values.backgroundColor);
	const selectedCategoryId = useStore(form.store, (state) => state.values.categoryId);
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
							<span className="truncate">
								{translateCatalogField(item.characteristics.name, item.systemCatalog) ??
									item.characteristics.name}
							</span>
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
						<form.AppField name="categoryId">
							{(field) => (
								<div className="flex items-end gap-2">
									<div
										className={cn(
											"flex-1 rounded-md p-2",
											!include.categoryId && "pointer-events-none bg-muted/40 opacity-60",
										)}
									>
										<field.CatalogCombobox
											label={m.collections_speciesCategory_title()}
											placeholder={m.fields_selectPlaceholder()}
											emptyLabel={m.filtering_comboboxEmpty()}
											values={categoryOptions}
										/>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="mb-2 self-end"
										onClick={() => {
											if (include.categoryId)
												form.setFieldValue("categoryId", defaultValues.categoryId);
											setInclude((prev) => ({ ...prev, categoryId: !prev.categoryId }));
										}}
									>
										{include.categoryId ? m.common_revert() : m.common_edit()}
									</Button>
								</div>
							)}
						</form.AppField>
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
											!include.name && "pointer-events-none bg-muted/40 opacity-60",
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
											if (include.name) form.setFieldValue("name", defaultValues.name);
											setInclude((prev) => ({ ...prev, name: !prev.name }));
										}}
									>
										{include.name ? m.common_revert() : m.common_edit()}
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
								disabled={selectedCategoryId === SELECT_NONE}
								onClick={() => {
									const category = catData?.items.find(
										(item) => String(item.id) === selectedCategoryId,
									);
									const next = toPresentationFields(category?.presentation ?? null);
									form.setFieldValue("iconKey", next.iconKey);
									form.setFieldValue("iconColor", next.iconColor);
									form.setFieldValue("backgroundColor", next.backgroundColor);
								}}
							>
								{m.collections_selectFromCategory()}
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
											(!include.categoryId &&
												!include.name &&
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
