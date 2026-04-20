import type { SpatialNodeEntity, SpatialNodeEntityId } from "@backend/core/domain/spatial/entities";
import { useStore } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { SELECT_NONE } from "@/components/form/select-sentinel";
import type { SpatialGeometry } from "@/components/spatial-layout-editor";
import {
	allocateNumberedLabelsForNewSiblings,
	duplicateNumberingStem,
} from "@/components/spatial-layout-editor/spatial-layout-editor.naming";
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
import { orpc } from "@/orpc/client";
import * as m from "@/paraglide/messages.js";
import { queryKeys } from "@/store/keys";
import { useLocationCreateMutation } from "@/store/mutations";

type LayoutDraft = {
	id: string;
	label: string;
	geometry: SpatialGeometry;
};

export type LocationCreateManySpatialResult = {
	id: string;
	parentId: string | null;
	rect: { x: number; y: number; width: number; height: number };
	label: string;
	ref: SpatialNodeEntity["ref"];
};

type NameMode = "preview" | "customStem";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	parentSpatialNodeId: SpatialNodeEntityId;
	nodes: LayoutDraft[];
	existingSiblingNames: string[];
	/** Called once after all locations + spatial nodes are created (single undo step in the layout editor). */
	onSpatialNodesCreated: (nodes: readonly LocationCreateManySpatialResult[]) => void;
};

type FormValues = {
	nameMode: NameMode;
	customStem: string;
	iconKey: string;
	iconColor: string;
	backgroundColor: string;
};

export function LocationCreateManyDialog({
	open,
	onOpenChange,
	parentSpatialNodeId,
	nodes,
	existingSiblingNames,
	onSpatialNodesCreated,
}: Props) {
	const mut = useLocationCreateMutation();
	const queryClient = useQueryClient();

	const nameModeOptions = useMemo(
		() => [
			{
				value: "preview" as const,
				label: m.components_locationLayoutEditor_createManyNameModePreview(),
			},
			{
				value: "customStem" as const,
				label: m.components_locationLayoutEditor_createManyNameModeCustomStem(),
			},
		],
		[],
	);

	const form = useAppForm({
		defaultValues: {
			nameMode: "preview" satisfies NameMode as NameMode,
			customStem: "",
			iconKey: SELECT_NONE,
			iconColor: "",
			backgroundColor: "",
		} satisfies FormValues as FormValues,
		onSubmit: async ({ value }) => {
			if (nodes.length === 0) return;
			if (value.nameMode === "customStem" && !value.customStem.trim()) return;
			const presentation = normalizePresentationInput({
				iconKey: value.iconKey === SELECT_NONE ? "" : value.iconKey,
				iconColor: value.iconColor,
				backgroundColor: value.backgroundColor,
			});
			const names =
				value.nameMode === "preview"
					? nodes.map((n) => n.label.trim())
					: allocateNumberedLabelsForNewSiblings(
							duplicateNumberingStem(value.customStem.trim()),
							existingSiblingNames,
							nodes.length,
						);
			onOpenChange(false);
			const spatialCreateInputs: Array<{
				label: string;
				rect: { x: number; y: number; width: number; height: number };
				ref: { entity: "location"; entityId: string };
			}> = [];
			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i];
				const name = (names[i] ?? "").trim();
				if (!name) continue;
				const entity = await mut.mutateAsync({ name, presentation });
				spatialCreateInputs.push({
					label: name,
					rect: {
						x: node.geometry.x,
						y: node.geometry.y,
						width: node.geometry.width,
						height: node.geometry.height,
					},
					ref: { entity: "location", entityId: String(entity.id) },
				});
			}
			const createdSpatial = await orpc.spatial.createManyNodes.call({
				items: spatialCreateInputs.map((row) => ({
					parentId: parentSpatialNodeId,
					kind: "frame" as const,
					ref: row.ref,
					rect: row.rect,
				})),
			});
			const createdNodes = createdSpatial.items.map((spatialNode, i) => ({
				id: String(spatialNode.id),
				parentId: spatialNode.parentId ? String(spatialNode.parentId) : null,
				rect: spatialNode.rect,
				label: spatialCreateInputs[i]?.label ?? "",
				ref: spatialNode.ref,
			}));
			await queryClient.invalidateQueries({ queryKey: queryKeys.spatial._def });
			if (createdNodes.length > 0) onSpatialNodesCreated(createdNodes);
		},
	});

	useEffect(() => {
		if (open) {
			form.reset();
		}
	}, [open, form]);

	const iconColor = useStore(form.store, (state) => state.values.iconColor);
	const backgroundColor = useStore(form.store, (state) => state.values.backgroundColor);
	const nameMode = useStore(form.store, (state) => state.values.nameMode);

	const close = () => onOpenChange(false);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.components_locationLayoutEditor_createManyLocationsTitle()}</DialogTitle>
					<DialogDescription className="sr-only">
						{m.components_locationLayoutEditor_createManyLocationsTitle()}
					</DialogDescription>
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
						<form.AppField name="nameMode">
							{(field) => (
								<field.Select
									label={m.components_locationLayoutEditor_createManyNamesLabel()}
									values={nameModeOptions}
								/>
							)}
						</form.AppField>
						{nameMode === "customStem" ? (
							<form.AppField name="customStem">
								{(field) => (
									<field.TextField
										label={m.components_locationLayoutEditor_createManyCustomStemLabel()}
										placeholder={m.components_locationLayoutEditor_createManyCustomStemPlaceholder()}
									/>
								)}
							</form.AppField>
						) : null}
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
							<form.SubscribeButton label={m.common_create()} />
						</DialogFooter>
					</form>
				</form.AppForm>
			</DialogContent>
		</Dialog>
	);
}
