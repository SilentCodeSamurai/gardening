import { useStore } from "@tanstack/react-form";
import { useEffect } from "react";
import { SELECT_NONE } from "@/components/form/select-sentinel";
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
import * as m from "@/paraglide/messages.js";
import { useLocationUpdateMutation } from "@/store/mutations";
import type { CachedLocation } from "@/store/query-cache-types";

type Props = {
	location: CachedLocation;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type FormValues = {
	name: string;
	iconKey: string;
	iconColor: string;
	backgroundColor: string;
};

export function LocationUpdateDialog({ location, open, onOpenChange }: Props) {
	const mut = useLocationUpdateMutation();

	const form = useAppForm({
		defaultValues: {
			name: location.name,
			iconKey: location.presentation?.iconKey ?? SELECT_NONE,
			iconColor: location.presentation?.iconColor ?? "",
			backgroundColor: location.presentation?.backgroundColor ?? "",
		} satisfies FormValues as FormValues,
		onSubmit: async ({ value }) => {
			const name = value.name.trim();
			if (!name) return;
			const presentation = normalizePresentationInput({
				iconKey: value.iconKey === SELECT_NONE ? "" : value.iconKey,
				iconColor: value.iconColor,
				backgroundColor: value.backgroundColor,
			});
			onOpenChange(false);
			await mut.mutateAsync({
				id: location.id,
				name,
				presentation,
			});
		},
	});

	useEffect(() => {
		if (!open) return;
		form.reset({
			name: location.name,
			iconKey: location.presentation?.iconKey ?? SELECT_NONE,
			iconColor: location.presentation?.iconColor ?? "",
			backgroundColor: location.presentation?.backgroundColor ?? "",
		});
	}, [open, location, form]);

	const iconColor = useStore(form.store, (state) => state.values.iconColor);
	const backgroundColor = useStore(form.store, (state) => state.values.backgroundColor);

	const close = () => onOpenChange(false);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.collections_location_update()}</DialogTitle>
					<DialogDescription className="sr-only">{m.collections_location_update()}</DialogDescription>
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
							name="name"
							validators={{
								onSubmit: ({ value }) => (!value?.trim() ? m.fields_required() : undefined),
							}}
						>
							{(field) => <field.TextField label={m.fields_name()} placeholder={m.fields_name()} />}
						</form.AppField>
						<div className="grid grid-cols-3 gap-2">
							<form.AppField name="iconKey">
								{(field) => (
									<field.IconPicker
										label={m.fields_icon()}
										noneLabel={m.fields_iconNone()}
										iconColor={iconColor}
										backgroundColor={backgroundColor}
									/>
								)}
							</form.AppField>
							<form.AppField name="iconColor">
								{(field) => <field.ColorPicker label={m.fields_iconColor()} placeholder="#2f855a" />}
							</form.AppField>
							<form.AppField name="backgroundColor">
								{(field) => (
									<field.ColorPicker label={m.fields_backgroundColor()} placeholder="#e6ffed" />
								)}
							</form.AppField>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={close}>
								{m.common_cancel()}
							</Button>
							<form.SubscribeButton label={m.common_save()} requireDirty />
						</DialogFooter>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}
