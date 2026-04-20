import type { SpatialNodeEntityId } from "@backend/core/domain/spatial/entities";
import { injectable } from "tsyringe";

export class SpatialPlacementSelfParentingError extends Error {
	constructor(params: { nodeId: string; parentId: string }) {
		super(`Spatial node ${params.nodeId} cannot be parented to itself (${params.parentId}).`);
		this.name = "SpatialPlacementSelfParentingError";
	}
}

export class SpatialPlacementCycleError extends Error {
	constructor(params: { nodeId: string; parentId: string }) {
		super(`Spatial node ${params.nodeId} cannot be parented under descendant ${params.parentId}.`);
		this.name = "SpatialPlacementCycleError";
	}
}

@injectable()
export class SpatialPlacementDomainService {
	public assertNoSelfParenting(params: { nodeId: SpatialNodeEntityId; parentId: SpatialNodeEntityId | null }): void {
		if (params.parentId !== null && String(params.parentId) === String(params.nodeId)) {
			throw new SpatialPlacementSelfParentingError({
				nodeId: String(params.nodeId),
				parentId: String(params.parentId),
			});
		}
	}

	public assertNoCycle(params: {
		nodeId: SpatialNodeEntityId;
		parentId: SpatialNodeEntityId | null;
		parentById: ReadonlyMap<string, SpatialNodeEntityId | null>;
	}): void {
		let cursor = params.parentId;
		while (cursor !== null) {
			if (String(cursor) === String(params.nodeId)) {
				throw new SpatialPlacementCycleError({
					nodeId: String(params.nodeId),
					parentId: String(params.parentId),
				});
			}
			const nextParent = params.parentById.get(String(cursor));
			cursor = nextParent === undefined ? null : nextParent;
		}
	}
}
