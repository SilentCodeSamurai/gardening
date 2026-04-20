import { RepositoryNotFoundError } from "@backend/core/application/ports/repositories/shared/base-repository.errors";
import {
	type SpatialNodeRepositoryPort,
	SpatialNodeRepositoryPortToken,
} from "@backend/core/application/ports/repositories/spatial/spatial-node.repository.port";
import type { SpatialNodeEntity, SpatialNodeEntityRef } from "@backend/core/domain/spatial/entities";
import { inject, injectable } from "tsyringe";

@injectable()
export class SpatialNodeRefApplicationService {
	constructor(@inject(SpatialNodeRepositoryPortToken) private readonly spatialRepo: SpatialNodeRepositoryPort) {}

	public async getPlacementStatusByRef(params: {
		ref: SpatialNodeEntityRef;
		workspaces: readonly SpatialNodeEntity["workspace"][];
	}): Promise<{
		node: SpatialNodeEntity | null;
		isPlaced: boolean;
	}> {
		const { ref, workspaces } = params;
		let node: SpatialNodeEntity | null = null;
		try {
			node = await this.spatialRepo.getOneByRef({
				filters: [{ ref }],
			});
		} catch (e) {
			if (!(e instanceof RepositoryNotFoundError)) throw e;
		}
		if (node !== null) {
			const nodeWorkspace = node.workspace;
			if (!workspaces.some((workspace) => workspace.equals(nodeWorkspace))) {
				node = null;
			}
		}
		if (!node) {
			return { node: null, isPlaced: false };
		}
		const nodeId = node.id;
		const all = await this.spatialRepo.getMany({
			filters: workspaces.map((workspace) => ({ workspace })),
		});
		const hasChildren = all.items.some((item) => String(item.parentId) === String(nodeId));
		const isPlaced = node.parentId !== null || hasChildren;
		return { node, isPlaced };
	}

	public async deleteUnplacedNodeByRef(params: {
		ref: SpatialNodeEntityRef;
		workspaces: readonly SpatialNodeEntity["workspace"][];
	}): Promise<void> {
		const placement = await this.getPlacementStatusByRef(params);
		if (!placement.node || placement.isPlaced) return;
		await this.spatialRepo.deleteOne({
			filters: [{ id: placement.node.id, workspace: placement.node.workspace }],
		});
	}
}
