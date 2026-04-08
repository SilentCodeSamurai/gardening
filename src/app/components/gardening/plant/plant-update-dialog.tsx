import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { SELECT_NONE } from "@/components/form/select-sentinel";
import { Button } from "@/components/ui/button";
import * as m from "@/paraglide/messages.js";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { CultivarEntityId, HydratedPlantEntity } from "@backend/core/domain/gardening/entities";
import { useAppForm } from "@/hooks/form";
import { queryKeys } from "@/store/keys";
import { usePlantUpdateMutation } from "@/store/mutations";

type Props = {
	plant: HydratedPlantEntity;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type FormValues = {
	cultivarId: string;
	title: string;
	description: string;
};

export function PlantUpdateDialog({ plant, open, onOpenChange }: Props) {
	const { data: cultivarData } = useQuery({ ...queryKeys.cultivar.all });
	const mut = usePlantUpdateMutation();

	const cultivarOptions = useMemo(() => {
		const cultivars = cultivarData?.items ?? [];
		return cultivars.map((c) => ({
			value: String(c.id),
			label: c.characteristics.name,
			presentation: c.presentation,
		}));
	}, [cultivarData?.items]);

	const form = useAppForm({
		defaultValues: {
			cultivarId: String(plant.cultivarId),
			title: plant.title ?? "",
			description: plant.description ?? "",
		} satisfies FormValues as FormValues,
		onSubmit: async ({ value }) => {
			if (value.cultivarId === SELECT_NONE) return;
			await mut.mutateAsync({
				id: plant.id,
				cultivarId: value.cultivarId as CultivarEntityId,
				title: value.title.trim() || null,
				description: value.description.trim() || null,
			});
			onOpenChange(false);
		},
	});

	useEffect(() => {
		if (!open) return;
		form.reset({
			cultivarId: String(plant.cultivarId),
			title: plant.title ?? "",
			description: plant.description ?? "",
		});
	}, [open, plant, form]);

	const close = () => onOpenChange(false);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.collections_plant_update()}</DialogTitle>
					<DialogDescription className="sr-only">{m.collections_plant_update()}</DialogDescription>
				</DialogHeader>
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
							name="cultivarId"
							validators={{
								onSubmit: ({ value }) =>
									!value || value === SELECT_NONE ? m.fields_selectRequired() : undefined,
							}}
						>
							{(field) => (
								<field.CatalogCombobox
									label={m.collections_cultivar_title()}
									placeholder={m.fields_selectPlaceholder()}
									emptyLabel={m.filtering_comboboxEmpty()}
									values={cultivarOptions}
								/>
							)}
						</form.AppField>
						<form.AppField name="title">
							{(field) => (
								<field.TextField label={m.fields_title()} placeholder={m.fields_title()} />
							)}
						</form.AppField>
						<form.AppField name="description">
							{(field) => (
								<field.TextField
									label={m.fields_description()}
									placeholder={m.fields_description()}
								/>
							)}
						</form.AppField>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={close}>
								{m.common_cancel()}
							</Button>
							<form.SubscribeButton label={m.common_save()} />
						</DialogFooter>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}
