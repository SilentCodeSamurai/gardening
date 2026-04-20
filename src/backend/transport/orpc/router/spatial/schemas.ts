import { z } from "zod";
import {
	SpatialNodeEntityIdSchema,
	SpatialNodeEntityIdsSchema,
	SpatialNodeRefSchema,
	SpatialRectSchema,
} from "../../shared/schemas";

export const CreateSpatialNodeInputSchema = z.object({
	parentId: SpatialNodeEntityIdSchema.nullable(),
	rect: SpatialRectSchema,
	kind: z.enum(["frame", "leaf"]),
	ref: SpatialNodeRefSchema,
});
export const CreateManySpatialNodeInputSchema = z.object({
	items: z.array(CreateSpatialNodeInputSchema),
});
export const DeleteSpatialNodeInputSchema = z.object({
	id: SpatialNodeEntityIdSchema,
});
export const DeleteManySpatialNodeInputSchema = z.object({
	ids: SpatialNodeEntityIdsSchema,
});
export const RestoreSpatialNodeInputSchema = z.object({
	id: SpatialNodeEntityIdSchema,
	parentId: SpatialNodeEntityIdSchema.nullable(),
	rect: SpatialRectSchema,
	kind: z.enum(["frame", "leaf"]),
	ref: SpatialNodeRefSchema,
});
export const GetSpatialTreeByRootIdInputSchema = z.object({
	id: SpatialNodeEntityIdSchema,
});
export const UpdateSpatialNodePlacementManyInputSchema = z.object({
	placements: z.array(
		z.object({
			id: SpatialNodeEntityIdSchema,
			parentId: SpatialNodeEntityIdSchema.nullable(),
			rect: SpatialRectSchema,
		}),
	),
});
