import type { SpeciesEntityId } from "@backend/core/domain/gardening/entities";
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
import { useCultivarUpdateManyMutation } from "@/store/mutations";
import type { CachedCultivar } from "@/store/query-cache-types";

type Props = {
	items: CachedCultivar[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type FormValues = {
	speciesId: string;
	name: string;
	description: string;
	iconKey: string;
	iconColor: string;
	backgroundColor: string;
};
type IncludeState = {
	speciesId: boolean;
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

function toPresentationFields(presentation: CachedCultivar["presentation"]) {
	return {
		iconKey: presentation?.iconKey ? String(presentation.iconKey) : SELECT_NONE,
		iconColor: presentation?.iconColor ?? "",
		backgroundColor: presentation?.backgroundColor ?? "",
	};
}

export function CultivarUpdateManyDialog({ items, open, onOpenChange }: Props) {
	const { data: speciesData } = useQuery({ ...queryKeys.species.all });
	const mut = useCultivarUpdateManyMutation();

	const speciesOptions = useMemo(() => {
		const speciesList = speciesData?.items ?? [];
		return speciesList.map((s) => ({
			value: String(s.id),
			label: translateCatalogField(s.characteristics.name, s.systemCatalog) ?? String(s.id),
			presentation: s.presentation,
		}));
	}, [speciesData?.items]);
	const defaultValues = useMemo<FormValues>(() => {
		const speciesId = getCommonValue(items.map((item) => item.speciesId ?? null));
		const name = getCommonValue(items.map((item) => item.characteristics.name)) ?? "";
		const description = getCommonValue(items.map((item) => item.characteristics.description ?? null));
		const iconKey = getCommonValue(items.map((item) => item.presentation?.iconKey ?? null));
		const iconColor = getCommonValue(items.map((item) => item.presentation?.iconColor ?? null));
		const backgroundColor = getCommonValue(items.map((item) => item.presentation?.backgroundColor ?? null));
		return {
			speciesId: speciesId ? String(speciesId) : SELECT_NONE,
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
				ids: CachedCultivar["id"][];
				speciesId?: SpeciesEntityId | null;
				characteristics?: CachedCultivar["characteristics"];
				presentation?: CachedCultivar["presentation"];
			} = { ids: items.map((item) => item.id) };
			if (include.speciesId) {
				patch.speciesId = value.speciesId === SELECT_NONE ? null : (value.speciesId as SpeciesEntityId);
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
			if (!include.speciesId && !includeCharacteristics && !includePresentation) return;
			onOpenChange(false);
			await mut.mutateAsync(patch);
		},
	});
	const [include, setInclude] = useState<IncludeState>({
		speciesId: false,
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
			speciesId: false,
			name: false,
			description: false,
			iconKey: false,
			iconColor: false,
			backgroundColor: false,
		});
	}, [defaultValues, form, open]);

	const iconColor = useStore(form.store, (state) => state.values.iconColor);
	const backgroundColor = useStore(form.store, (state) => state.values.backgroundColor);
	const selectedSpeciesId = useStore(form.store, (state) => state.values.speciesId);
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
							<span className="truncate">{item.characteristics.name}</span>
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
						<form.AppField name="speciesId">
							{(field) => (
								<div className="flex items-end gap-2">
									<div
										className={cn(
											"flex-1 rounded-md p-2",
											!include.speciesId && "pointer-events-none bg-muted/40 opacity-60",
										)}
									>
										<field.CatalogCombobox
											label={m.collections_species_title()}
											placeholder={m.fields_selectPlaceholder()}
											emptyLabel={m.filtering_comboboxEmpty()}
											values={speciesOptions}
										/>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="mb-2 self-end"
										onClick={() => {
											if (include.speciesId)
												form.setFieldValue("speciesId", defaultValues.speciesId);
											setInclude((prev) => ({ ...prev, speciesId: !prev.speciesId }));
										}}
									>
										{include.speciesId ? m.common_revert() : m.common_edit()}
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
								disabled={selectedSpeciesId === SELECT_NONE}
								onClick={() => {
									const species = speciesData?.items.find(
										(item) => String(item.id) === selectedSpeciesId,
									);
									const next = toPresentationFields(species?.presentation ?? null);
									form.setFieldValue("iconKey", next.iconKey);
									form.setFieldValue("iconColor", next.iconColor);
									form.setFieldValue("backgroundColor", next.backgroundColor);
								}}
							>
								{m.collections_selectFromSpecies()}
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
											(!include.speciesId &&
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
