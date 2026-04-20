import {
	SpatialNodeCreateManyUseCase,
	SpatialNodeCreateUseCase,
	SpatialNodeDeleteManyUseCase,
	SpatialNodeDeleteUseCase,
	SpatialNodeGetAllUseCase,
	SpatialNodeGetTreeForRootIdUseCase,
	SpatialNodeRestoreUseCase,
	SpatialNodeUpdatePlacementManyUseCase,
} from "@backend/core/application/use-cases/spatial/spatial.use-cases";

import { createUseCaseContextFromOrpc } from "../../create-use-case-context";
import { authenticatedProcedure } from "../../orpc-procedure";
import { runUseCaseOrpc } from "../../shared/run-use-case-orpc";
import {
	CreateManySpatialNodeInputSchema,
	CreateSpatialNodeInputSchema,
	DeleteManySpatialNodeInputSchema,
	DeleteSpatialNodeInputSchema,
	GetSpatialTreeByRootIdInputSchema,
	RestoreSpatialNodeInputSchema,
	UpdateSpatialNodePlacementManyInputSchema,
} from "./schemas";

export const spatialRouter = {
	createNode: authenticatedProcedure
		.input(CreateSpatialNodeInputSchema)
		.handler(({ input, context }) =>
			runUseCaseOrpc(SpatialNodeCreateUseCase, { context: createUseCaseContextFromOrpc(context), dto: input }),
		),
	createManyNodes: authenticatedProcedure.input(CreateManySpatialNodeInputSchema).handler(({ input, context }) =>
		runUseCaseOrpc(SpatialNodeCreateManyUseCase, {
			context: createUseCaseContextFromOrpc(context),
			dto: input,
		}),
	),
	deleteNode: authenticatedProcedure.input(DeleteSpatialNodeInputSchema).handler(({ input, context }) =>
		runUseCaseOrpc(SpatialNodeDeleteUseCase, {
			context: createUseCaseContextFromOrpc(context),
			dto: { id: input.id },
		}),
	),
	deleteManyNodes: authenticatedProcedure.input(DeleteManySpatialNodeInputSchema).handler(({ input, context }) =>
		runUseCaseOrpc(SpatialNodeDeleteManyUseCase, {
			context: createUseCaseContextFromOrpc(context),
			dto: input,
		}),
	),
	restoreNode: authenticatedProcedure
		.input(RestoreSpatialNodeInputSchema)
		.handler(({ input, context }) =>
			runUseCaseOrpc(SpatialNodeRestoreUseCase, { context: createUseCaseContextFromOrpc(context), dto: input }),
		),
	getAllNodes: authenticatedProcedure.handler(({ context }) =>
		runUseCaseOrpc(SpatialNodeGetAllUseCase, { context: createUseCaseContextFromOrpc(context) }),
	),
	getTreeForRootId: authenticatedProcedure.input(GetSpatialTreeByRootIdInputSchema).handler(({ input, context }) =>
		runUseCaseOrpc(SpatialNodeGetTreeForRootIdUseCase, {
			context: createUseCaseContextFromOrpc(context),
			dto: { id: input.id },
		}),
	),
	updatePlacementMany: authenticatedProcedure
		.input(UpdateSpatialNodePlacementManyInputSchema)
		.handler(({ input, context }) =>
			runUseCaseOrpc(SpatialNodeUpdatePlacementManyUseCase, {
				context: createUseCaseContextFromOrpc(context),
				dto: { placements: input.placements },
			}),
		),
};
