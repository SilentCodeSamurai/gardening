import {
  SpatialNodeCreateUseCase,
  SpatialNodeDeleteManyUseCase,
  SpatialNodeDeleteUseCase,
  SpatialNodeGetAllUseCase,
  SpatialNodeGetTreeForRootIdUseCase,
  SpatialNodeRestoreUseCase,
  SpatialNodeUpdatePlacementManyUseCase,
} from "@backend/core/application/use-cases/spatial/spatial.use-cases";
import { RepositoryNotFoundError } from "@backend/core/application/ports/repositories/shared/base-repository.errors";
import { SpatialNodeRepositoryPortToken } from "@backend/core/application/ports/repositories/spatial/spatial-node.repository.port";
import { createTestUseCaseContext } from "../create-test-use-case-context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUseCaseTestContainer } from "../gardening/create-use-case-test-container";
import {
	SpatialPlacementCycleError,
	SpatialPlacementSelfParentingError,
} from "@backend/core/domain/services/spatial-placement.domain-service";

describe("Spatial use-cases", () => {
  let c: ReturnType<typeof createUseCaseTestContainer>;
  let context: ReturnType<typeof createTestUseCaseContext>;

  beforeEach(() => {
    c = createUseCaseTestContainer();
    context = createTestUseCaseContext();
  });

  it("create + getAll + getTreeForRootId happy path", async () => {
    const create = c.resolve(SpatialNodeCreateUseCase);
    const getAll = c.resolve(SpatialNodeGetAllUseCase);
    const getTree = c.resolve(SpatialNodeGetTreeForRootIdUseCase);

    const root = await create.run({
      context,
      dto: {
        parentId: null,
        kind: "frame",
        rect: { x: 0, y: 0, width: 500, height: 400 },
        ref: { entity: "location", entityId: "loc-root" },
      },
    });
    await create.run({
      context,
      dto: {
        parentId: root.id,
        kind: "leaf",
        rect: { x: 20, y: 30, width: 40, height: 50 },
        ref: { entity: "plant", entityId: "plant-1" },
      },
    });

    expect((await getAll.run({ context })).items.length).toBeGreaterThanOrEqual(2);
    const tree = await getTree.run({ context, dto: { id: root.id } });
    expect(tree.children.length).toBe(1);
  });

  it("getTreeForRootId throws when root is missing", async () => {
    const getTree = c.resolve(SpatialNodeGetTreeForRootIdUseCase);
    await expect(getTree.run({ context, dto: { id: "missing-root-id" as never } })).rejects.toBeInstanceOf(
      RepositoryNotFoundError,
    );
  });

  it("updatePlacementMany updates node geometry and parent", async () => {
    const create = c.resolve(SpatialNodeCreateUseCase);
    const apply = c.resolve(SpatialNodeUpdatePlacementManyUseCase);

    const root = await create.run({
      context,
      dto: {
        parentId: null,
        kind: "frame",
        rect: { x: 0, y: 0, width: 800, height: 600 },
        ref: { entity: "location", entityId: "root" },
      },
    });
    const parentB = await create.run({
      context,
      dto: {
        parentId: root.id,
        kind: "frame",
        rect: { x: 20, y: 20, width: 200, height: 200 },
        ref: { entity: "location", entityId: "parent-b" },
      },
    });
    const moving = await create.run({
      context,
      dto: {
        parentId: root.id,
        kind: "leaf",
        rect: { x: 10, y: 10, width: 30, height: 30 },
        ref: { entity: "plant", entityId: "moving-plant" },
      },
    });

    const res = await apply.run({
      context,
      dto: { placements: [
        {
          id: moving.id,
          parentId: parentB.id,
          rect: { x: 77, y: 88, width: 30, height: 30 },
        },
      ] },
    });

    expect(res.results).toHaveLength(1);
    const updated = res.results[0];
    expect(updated?.parentId).toEqual(parentB.id);
    expect(updated?.rect.x).toBe(77);
    expect(updated?.rect.y).toBe(88);
  });

	it("updatePlacementMany returns empty results for empty placements", async () => {
		const apply = c.resolve(SpatialNodeUpdatePlacementManyUseCase);

		const res = await apply.run({
			context,
			dto: { placements: [] },
		});

		expect(res.results).toEqual([]);
	});

	it("updatePlacementMany throws when a placement id is missing", async () => {
		const apply = c.resolve(SpatialNodeUpdatePlacementManyUseCase);

		await expect(
			apply.run({
				context,
				dto: {
					placements: [
						{
							id: "missing-node-id" as never,
							parentId: null,
							rect: { x: 0, y: 0, width: 10, height: 10 },
						},
					],
				},
			}),
		).rejects.toBeInstanceOf(RepositoryNotFoundError);
	});

	it("updatePlacementMany batches identical patches via updateMany", async () => {
		const repo = c.resolve(SpatialNodeRepositoryPortToken);
		const proto = Object.getPrototypeOf(repo);
		const updateManySpy = vi.spyOn(proto, "updateMany");
		const create = c.resolve(SpatialNodeCreateUseCase);
		const apply = c.resolve(SpatialNodeUpdatePlacementManyUseCase);

		const root = await create.run({
			context,
			dto: {
				parentId: null,
				kind: "frame",
				rect: { x: 0, y: 0, width: 1000, height: 800 },
				ref: { entity: "location", entityId: "root-batch" },
			},
		});

		const parentA = await create.run({
			context,
			dto: {
				parentId: root.id,
				kind: "frame",
				rect: { x: 10, y: 10, width: 200, height: 200 },
				ref: { entity: "location", entityId: "parent-a" },
			},
		});
		const parentB = await create.run({
			context,
			dto: {
				parentId: root.id,
				kind: "frame",
				rect: { x: 300, y: 10, width: 200, height: 200 },
				ref: { entity: "location", entityId: "parent-b" },
			},
		});

		const mkMoving = async (entityId: string) => {
			return create.run({
				context,
				dto: {
					parentId: root.id,
					kind: "leaf",
					rect: { x: 1, y: 1, width: 20, height: 20 },
					ref: { entity: "plant", entityId },
				},
			});
		};

		const moving1 = await mkMoving("moving-1");
		const moving2 = await mkMoving("moving-2");
		const moving3 = await mkMoving("moving-3");
		const moving4 = await mkMoving("moving-4");

		const rectA = { x: 77, y: 88, width: 30, height: 30 };
		const rectB = { x: 120, y: 140, width: 30, height: 30 };

		const res = await apply.run({
			context,
			dto: {
				placements: [
					{ id: moving1.id, parentId: parentA.id, rect: rectA },
					{ id: moving2.id, parentId: parentA.id, rect: rectA }, // same patch group as moving1
					{ id: moving3.id, parentId: parentB.id, rect: rectB },
					{ id: moving4.id, parentId: parentB.id, rect: rectB }, // same patch group as moving3
				],
			},
		});

		expect(res.results).toHaveLength(4);
		expect(updateManySpy).toHaveBeenCalledTimes(2);

		const calls = updateManySpy.mock.calls.map((call) => call[0] as any);
		const groups = calls.map((c) => ({
			ids: new Set(c.filters.map((f: any) => String(f.id))),
			parentId: c.dto.parentId,
			rect: c.dto.rect,
		}));

		const groupA = groups.find((g) => String(g.parentId) === String(parentA.id));
		expect(groupA).toBeTruthy();
		expect(groupA!.rect).toEqual(rectA);
		expect(groupA!.ids).toEqual(new Set([String(moving1.id), String(moving2.id)]));

		const groupB = groups.find((g) => String(g.parentId) === String(parentB.id));
		expect(groupB).toBeTruthy();
		expect(groupB!.rect).toEqual(rectB);
		expect(groupB!.ids).toEqual(new Set([String(moving3.id), String(moving4.id)]));
	});

	it("updatePlacementMany supports duplicate entries (results preserve input order/length)", async () => {
		const create = c.resolve(SpatialNodeCreateUseCase);
		const apply = c.resolve(SpatialNodeUpdatePlacementManyUseCase);

		const root = await create.run({
			context,
			dto: {
				parentId: null,
				kind: "frame",
				rect: { x: 0, y: 0, width: 300, height: 300 },
				ref: { entity: "location", entityId: "root-dup" },
			},
		});

		const parent = await create.run({
			context,
			dto: {
				parentId: root.id,
				kind: "frame",
				rect: { x: 10, y: 10, width: 100, height: 100 },
				ref: { entity: "location", entityId: "parent-dup" },
			},
		});

		const moving = await create.run({
			context,
			dto: {
				parentId: root.id,
				kind: "leaf",
				rect: { x: 1, y: 1, width: 20, height: 20 },
				ref: { entity: "plant", entityId: "moving-dup" },
			},
		});

		const rect = { x: 9, y: 8, width: 20, height: 20 };
		const res = await apply.run({
			context,
			dto: {
				placements: [
					{ id: moving.id, parentId: parent.id, rect },
					{ id: moving.id, parentId: parent.id, rect },
				],
			},
		});

		expect(res.results).toHaveLength(2);
		expect(res.results[0].id).toBe(moving.id);
		expect(res.results[1].id).toBe(moving.id);
		expect(res.results[0].parentId).toBe(parent.id);
		expect(res.results[1].parentId).toBe(parent.id);
		expect(res.results[0].rect).toEqual(rect);
		expect(res.results[1].rect).toEqual(rect);
	});

  it("updatePlacementMany rejects self-parent reparent", async () => {
    const create = c.resolve(SpatialNodeCreateUseCase);
    const apply = c.resolve(SpatialNodeUpdatePlacementManyUseCase);

    const root = await create.run({
      context,
      dto: {
        parentId: null,
        kind: "frame",
        rect: { x: 0, y: 0, width: 400, height: 300 },
        ref: { entity: "location", entityId: "root-self" },
      },
    });

    await expect(
      apply.run({
        context,
        dto: { placements: [
          {
            id: root.id,
            parentId: root.id,
            rect: { x: 0, y: 0, width: 400, height: 300 },
          },
        ] },
      }),
	    ).rejects.toBeInstanceOf(SpatialPlacementSelfParentingError);
  });

  it("updatePlacementMany rejects reparent under descendant", async () => {
    const create = c.resolve(SpatialNodeCreateUseCase);
    const apply = c.resolve(SpatialNodeUpdatePlacementManyUseCase);

    const root = await create.run({
      context,
      dto: {
        parentId: null,
        kind: "frame",
        rect: { x: 0, y: 0, width: 600, height: 600 },
        ref: { entity: "location", entityId: "root-cycle" },
      },
    });
    const child = await create.run({
      context,
      dto: {
        parentId: root.id,
        kind: "frame",
        rect: { x: 20, y: 20, width: 200, height: 200 },
        ref: { entity: "location", entityId: "child-cycle" },
      },
    });
    await create.run({
      context,
      dto: {
        parentId: child.id,
        kind: "leaf",
        rect: { x: 10, y: 10, width: 30, height: 30 },
        ref: { entity: "plant", entityId: "grandchild-cycle" },
      },
    });

    await expect(
      apply.run({
        context,
        dto: { placements: [
          {
            id: root.id,
            parentId: child.id,
            rect: { x: 0, y: 0, width: 600, height: 600 },
          },
        ] },
      }),
	    ).rejects.toBeInstanceOf(SpatialPlacementCycleError);
  });

  it("updatePlacementMany rolls back earlier successful updates when a later operation fails", async () => {
    const create = c.resolve(SpatialNodeCreateUseCase);
    const apply = c.resolve(SpatialNodeUpdatePlacementManyUseCase);
    const getTree = c.resolve(SpatialNodeGetTreeForRootIdUseCase);

    const root = await create.run({
      context,
      dto: {
        parentId: null,
        kind: "frame",
        rect: { x: 0, y: 0, width: 400, height: 300 },
        ref: { entity: "location", entityId: "root-rollback" },
      },
    });
    const child = await create.run({
      context,
      dto: {
        parentId: root.id,
        kind: "leaf",
        rect: { x: 10, y: 20, width: 40, height: 50 },
        ref: { entity: "plant", entityId: "child-rollback" },
      },
    });

    await expect(
      apply.run({
        context,
        dto: {
          placements: [
            {
              id: child.id,
              parentId: root.id,
              rect: { x: 99, y: 111, width: 40, height: 50 },
            },
            {
              id: root.id,
              parentId: root.id,
              rect: { x: 0, y: 0, width: 400, height: 300 },
            },
          ],
        },
      }),
    ).rejects.toBeInstanceOf(SpatialPlacementSelfParentingError);

    const tree = await getTree.run({ context, dto: { id: root.id } });
    const persistedChild = tree.children.find((n) => n.id === child.id);
    expect(persistedChild?.rect.x).toBe(10);
    expect(persistedChild?.rect.y).toBe(20);
  });

  it("delete removes existing spatial node", async () => {
    const create = c.resolve(SpatialNodeCreateUseCase);
    const del = c.resolve(SpatialNodeDeleteUseCase);
    const getAll = c.resolve(SpatialNodeGetAllUseCase);

    const root = await create.run({
      context,
      dto: {
        parentId: null,
        kind: "frame",
        rect: { x: 0, y: 0, width: 400, height: 300 },
        ref: { entity: "location", entityId: "root-delete" },
      },
    });
    const leaf = await create.run({
      context,
      dto: {
        parentId: root.id,
        kind: "leaf",
        rect: { x: 12, y: 16, width: 20, height: 30 },
        ref: { entity: "plant", entityId: "leaf-delete" },
      },
    });

    await del.run({ context, dto: { id: leaf.id } });
    const { items } = await getAll.run({ context });
    expect(items.some((node) => node.id === leaf.id)).toBe(false);
  });

  it("restore uses create permission for missing node and update permission for existing node", async () => {
    const create = c.resolve(SpatialNodeCreateUseCase);
    const restore = c.resolve(SpatialNodeRestoreUseCase);
    const getAll = c.resolve(SpatialNodeGetAllUseCase);

    const root = await create.run({
      context,
      dto: {
        parentId: null,
        kind: "frame",
        rect: { x: 0, y: 0, width: 500, height: 500 },
        ref: { entity: "location", entityId: "root-restore" },
      },
    });

    const restoredId = "restored-spatial-id" as never;
    const createdViaRestore = await restore.run({
      context,
      dto: {
        id: restoredId,
        parentId: root.id,
        kind: "leaf",
        rect: { x: 5, y: 5, width: 10, height: 10 },
        ref: { entity: "plant", entityId: "restore-created" },
      },
    });
    expect(createdViaRestore.id).toEqual(restoredId);

    const updatedViaRestore = await restore.run({
      context,
      dto: {
        id: restoredId,
        parentId: root.id,
        kind: "leaf",
        rect: { x: 42, y: 84, width: 10, height: 10 },
        ref: { entity: "plant", entityId: "restore-created" },
      },
    });
    expect(updatedViaRestore.rect.x).toBe(42);
    expect(updatedViaRestore.rect.y).toBe(84);

    const { items } = await getAll.run({ context });
    expect(items.some((node) => node.id === restoredId)).toBe(true);
  });

  it("deleteMany removes requested nodes", async () => {
    const create = c.resolve(SpatialNodeCreateUseCase);
    const deleteMany = c.resolve(SpatialNodeDeleteManyUseCase);
    const getAll = c.resolve(SpatialNodeGetAllUseCase);

    const root = await create.run({
      context,
      dto: {
        parentId: null,
        kind: "frame",
        rect: { x: 0, y: 0, width: 300, height: 300 },
        ref: { entity: "location", entityId: "root-dm" },
      },
    });
    const childA = await create.run({
      context,
      dto: {
        parentId: root.id,
        kind: "leaf",
        rect: { x: 10, y: 10, width: 20, height: 20 },
        ref: { entity: "plant", entityId: "dm-a" },
      },
    });
    const childB = await create.run({
      context,
      dto: {
        parentId: root.id,
        kind: "leaf",
        rect: { x: 40, y: 10, width: 20, height: 20 },
        ref: { entity: "plant", entityId: "dm-b" },
      },
    });

    const out = await deleteMany.run({ context, dto: { ids: [childA.id, childB.id] } });
    expect(out.count).toBe(2);

    const { items } = await getAll.run({ context });
    expect(items.some((n) => n.id === childA.id)).toBe(false);
    expect(items.some((n) => n.id === childB.id)).toBe(false);
    expect(items.some((n) => n.id === root.id)).toBe(true);
  });
});
