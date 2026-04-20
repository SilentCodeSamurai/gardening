import "reflect-metadata";

import { RepositoryNotFoundError } from "@backend/core/application/ports/repositories/shared/base-repository.errors";
import type { SpatialNodeRepositoryPort } from "@backend/core/application/ports/repositories/spatial/spatial-node.repository.port";
import { SpatialNodeRefApplicationService } from "@backend/core/application/services/spatial/spatial-node-ref.application-service";
import { WorkspaceVO } from "@backend/core/domain/access/workspace.vo";
import type { SpatialNodeEntity } from "@backend/core/domain/spatial/entities";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("SpatialNodeRefApplicationService", () => {
	let service: SpatialNodeRefApplicationService;
	let repo: SpatialNodeRepositoryPort;

	const wk = WorkspaceVO.user("u1");
	const wkOther = WorkspaceVO.user("u2");
	const ref = { entity: "plant", entityId: "p1" } as const;
	const baseRect = { x: 0, y: 0, width: 100, height: 50 };

	const makeNode = (overrides?: Partial<SpatialNodeEntity>): SpatialNodeEntity =>
		({
			id: "node-1" as never,
			createdAt: new Date(),
			updatedAt: new Date(),
			workspace: wk,
			parentId: null,
			rect: baseRect,
			kind: "leaf",
			ref,
			...overrides,
		}) as SpatialNodeEntity;

	beforeEach(() => {
		repo = {
			createOne: vi.fn(),
			createMany: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyStrict: vi.fn(),
			updateOne: vi.fn(),
			updateMany: vi.fn(),
			deleteOne: vi.fn(),
			deleteMany: vi.fn(),
			getOneByRef: vi.fn(),
			restoreOne: vi.fn(),
			getTreeForRootOne: vi.fn(),
		};
		service = new SpatialNodeRefApplicationService(repo);
	});

	it("getPlacementStatusByRef returns unplaced when node is missing", async () => {
		(repo.getOneByRef as ReturnType<typeof vi.fn>).mockRejectedValue(
			new RepositoryNotFoundError({ resource: "SpatialNodeEntity", context: { ref } }),
		);

		const result = await service.getPlacementStatusByRef({ ref, workspaces: [wk] });

		expect(result).toEqual({ node: null, isPlaced: false });
	});

	it("getPlacementStatusByRef returns unplaced when node workspace is outside scope", async () => {
		(repo.getOneByRef as ReturnType<typeof vi.fn>).mockResolvedValue(makeNode({ workspace: wkOther }));

		const result = await service.getPlacementStatusByRef({ ref, workspaces: [wk] });

		expect(result).toEqual({ node: null, isPlaced: false });
	});

	it("getPlacementStatusByRef marks node as placed when it has a parent", async () => {
		const node = makeNode({ parentId: "parent-1" as never });
		(repo.getOneByRef as ReturnType<typeof vi.fn>).mockResolvedValue(node);
		(repo.getMany as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [node] });

		const result = await service.getPlacementStatusByRef({ ref, workspaces: [wk] });

		expect(result.isPlaced).toBe(true);
		expect(result.node?.id).toEqual(node.id);
	});

	it("getPlacementStatusByRef marks node as placed when it has children", async () => {
		const node = makeNode();
		const child = makeNode({ id: "node-2" as never, parentId: node.id });
		(repo.getOneByRef as ReturnType<typeof vi.fn>).mockResolvedValue(node);
		(repo.getMany as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [node, child] });

		const result = await service.getPlacementStatusByRef({ ref, workspaces: [wk] });

		expect(result.isPlaced).toBe(true);
	});

	it("deleteUnplacedNodeByRef deletes only when node is not placed", async () => {
		const node = makeNode();
		(repo.getOneByRef as ReturnType<typeof vi.fn>).mockResolvedValue(node);
		(repo.getMany as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [node] });

		await service.deleteUnplacedNodeByRef({ ref, workspaces: [wk] });

		expect(repo.deleteOne).toHaveBeenCalledWith({
			filters: [{ id: node.id, workspace: node.workspace }],
		});

		(repo.deleteOne as ReturnType<typeof vi.fn>).mockClear();
		(repo.getMany as ReturnType<typeof vi.fn>).mockResolvedValue({
			items: [node, makeNode({ id: "node-2" as never, parentId: node.id })],
		});
		await service.deleteUnplacedNodeByRef({ ref, workspaces: [wk] });
		expect(repo.deleteOne).not.toHaveBeenCalled();
	});

	it("deleteUnplacedNodeByRef does not delete when node already has a parent", async () => {
		const placed = makeNode({ parentId: "parent-1" as never });
		(repo.getOneByRef as ReturnType<typeof vi.fn>).mockResolvedValue(placed);
		// Even if getMany were called, it shouldn't matter because parentId already makes it placed.
		(repo.getMany as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [placed] });

		await service.deleteUnplacedNodeByRef({ ref, workspaces: [wk] });

		expect(repo.deleteOne).not.toHaveBeenCalled();
	});

	it("deleteUnplacedNodeByRef does not delete when node has children", async () => {
		const node = makeNode({ parentId: null });
		const child = makeNode({ id: "node-2" as never, parentId: node.id });
		(repo.getOneByRef as ReturnType<typeof vi.fn>).mockResolvedValue(node);
		(repo.getMany as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [node, child] });

		await service.deleteUnplacedNodeByRef({ ref, workspaces: [wk] });

		expect(repo.deleteOne).not.toHaveBeenCalled();
	});
});
