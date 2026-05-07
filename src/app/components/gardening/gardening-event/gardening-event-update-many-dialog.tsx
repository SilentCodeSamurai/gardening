import { GardeningActionType } from "@backend/core/domain/gardening/enums";
import type { GardeningAction } from "@backend/core/domain/gardening/value-objects";
import { useEffect, useMemo, useState } from "react";
import { SELECT_NONE } from "@/components/form/select-sentinel";
import { GardeningActionPresentationIcon } from "@/components/gardening/gardening-action-icon";
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
import { gardeningActionMessage } from "@/lib/gardening-action-messages";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages.js";
import { useGardeningEventUpdateManyMutation } from "@/store/mutations";
import type { CachedGardeningEvent } from "@/store/query-cache-types";

type Props = {
	items: CachedGardeningEvent[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type FormValues = {
	actionType: string;
	content: string;
	occurredAt: Date;
};
type IncludeState = { actionType: boolean; content: boolean; occurredAt: boolean };

function getCommonValue<T>(items: T[]): T | undefined {
	if (items.length === 0) return undefined;
	const first = items[0];
	if (items.every((item) => item === first)) return first;
	return undefined;
}

export function GardeningEventUpdateManyDialog({ items, open, onOpenChange }: Props) {
	const mut = useGardeningEventUpdateManyMutation();
	const actionTypeValues = useMemo(
		() =>
			(Object.values(GardeningActionType) as GardeningAction["type"][]).map((type) => ({
				value: type,
				label: gardeningActionMessage(type),
			})),
		[],
	);
	const defaultValues = useMemo<FormValues>(() => {
		const actionType = getCommonValue(items.map((item) => item.action.type)) ?? SELECT_NONE;
		const content = getCommonValue(items.map((item) => item.action.content ?? "")) ?? "";
		const occurredAtIso = getCommonValue(items.map((item) => item.occurredAt?.toISOString() ?? null));
		const occurredAt = occurredAtIso ? new Date(occurredAtIso) : new Date();
		return { actionType, content, occurredAt };
	}, [items]);

	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const allowed = Object.values(GardeningActionType) as GardeningAction["type"][];
			if (!(value.occurredAt instanceof Date) || Number.isNaN(value.occurredAt.getTime())) return;
			if (items.length === 0) return;
			const includeAction = include.actionType;
			const includeOccurredAt = include.occurredAt;
			if (!includeAction && !includeOccurredAt) return;
			const patch: {
				ids: CachedGardeningEvent["id"][];
				action?: GardeningAction;
				occurredAt?: Date | null;
			} = { ids: items.map((item) => item.id) };
			if (includeAction) {
				const actionType = value.actionType as GardeningAction["type"];
				if (!allowed.includes(actionType)) return;
				patch.action = { type: actionType, content: value.content };
			}
			if (includeOccurredAt) {
				patch.occurredAt = value.occurredAt;
			}
			onOpenChange(false);
			await mut.mutateAsync(patch);
		},
	});
	const [include, setInclude] = useState<IncludeState>({ actionType: false, content: false, occurredAt: false });

	useEffect(() => {
		if (!open) return;
		form.reset(defaultValues);
		setInclude({ actionType: false, content: false, occurredAt: false });
	}, [defaultValues, form, open]);

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
							<GardeningActionPresentationIcon action={item.action} />
							<span className="truncate">{gardeningActionMessage(item.action.type)}</span>
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
							name="occurredAt"
							validators={{
								onSubmit: ({ value }) => {
									if (!include.occurredAt) return undefined;
									if (!(value instanceof Date)) return m.fields_required();
									return Number.isNaN(value.getTime()) ? m.fields_required() : undefined;
								},
							}}
						>
							{(field) => (
								<div className="flex items-end gap-2">
									<div
										className={cn(
											"flex-1 rounded-md p-2",
											!include.occurredAt && "pointer-events-none bg-muted/40 opacity-60",
										)}
									>
										<field.DateTimePicker label={m.fields_occurredAt()} />
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="mb-2 self-end"
										onClick={() => {
											if (include.occurredAt)
												form.setFieldValue("occurredAt", defaultValues.occurredAt);
											setInclude((prev) => ({ ...prev, occurredAt: !prev.occurredAt }));
										}}
									>
										{include.occurredAt ? m.common_revert() : m.common_edit()}
									</Button>
								</div>
							)}
						</form.AppField>
						<form.AppField
							name="actionType"
							validators={{
								onSubmit: ({ value }) =>
									!include.actionType || value?.trim() ? undefined : m.fields_selectRequired(),
							}}
						>
							{(field) => (
								<div className="flex items-end gap-2">
									<div
										className={cn(
											"flex-1 rounded-md p-2",
											!include.actionType && "pointer-events-none bg-muted/40 opacity-60",
										)}
									>
										<field.Select
											label={m.components_detail_field_actionType()}
											placeholder={m.fields_selectPlaceholder()}
											values={actionTypeValues}
										/>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="mb-2 self-end"
										onClick={() => {
											const nextInclude = !include.actionType;
											if (include.actionType)
												form.setFieldValue("actionType", defaultValues.actionType);
											setInclude((prev) => ({
												...prev,
												actionType: nextInclude,
												content: nextInclude,
											}));
										}}
									>
										{include.actionType ? m.common_revert() : m.common_edit()}
									</Button>
								</div>
							)}
						</form.AppField>
						<form.AppField name="content">
							{(field) => (
								<div className="flex items-end gap-2">
									<div
										className={cn(
											"flex-1 rounded-md p-2",
											!include.content && "pointer-events-none bg-muted/40 opacity-60",
										)}
									>
										<field.TextArea label={m.fields_description()} rows={4} />
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="mb-2 self-end"
										onClick={() => {
											const nextInclude = !include.content;
											if (include.content) form.setFieldValue("content", defaultValues.content);
											setInclude((prev) => ({
												...prev,
												actionType: nextInclude,
												content: nextInclude,
											}));
										}}
									>
										{include.content ? m.common_revert() : m.common_edit()}
									</Button>
								</div>
							)}
						</form.AppField>
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
											isSubmitting || !isDirty || (!include.actionType && !include.occurredAt)
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
