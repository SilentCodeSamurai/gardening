import { RepositoryNotFoundError } from "@backend/core/application/ports/repositories/shared/base-repository.errors";
import {
	type SpatialNodeRepositoryPort,
	SpatialNodeRepositoryPortToken,
} from "@backend/core/application/ports/repositories/spatial/spatial-node.repository.port";
import {
	type TransactionManagerPort,
	TransactionManagerPortToken,
} from "@backend/core/application/ports/transaction/transaction-manager.port";
import { AccessControlApplicationService } from "@backend/core/application/services/access-control/access-control.application-service";
import { BaseUseCase } from "@backend/core/application/use-cases/shared/base.use-case";
import { TransactionalUseCase } from "@backend/core/application/use-cases/shared/transactional.use-case";
import { SpatialPlacementDomainService } from "@backend/core/domain/services/spatial-placement.domain-service";
import type {
	SpatialNodeEntity,
	SpatialNodeEntityId,
	SpatialNodeEntityRef,
	SpatialNodeTreeNode,
} from "@backend/core/domain/spatial/entities";
import type { ItemsContainer } from "@backend/shared/types";
import { inject, injectable } from "tsyringe";
import type { UseCaseRequest } from "#/backend/core/application/use-cases/use-case-context";

async function getSpatialNodeOrNull(
	repo: SpatialNodeRepositoryPort,
	workspace: SpatialNodeEntity["workspace"],
	id: SpatialNodeEntityId,
): Promise<SpatialNodeEntity | null> {
	try {
		return await repo.getOne({ filters: [{ id, workspace }] });
	} catch (e) {
		if (e instanceof RepositoryNotFoundError) return null;
		throw e;
	}
}

export type SpatialNodeCreateUseCaseInput = UseCaseRequest<{
	parentId: SpatialNodeEntityId | null;
	rect: SpatialNodeEntity["rect"];
	kind: SpatialNodeEntity["kind"];
	ref: SpatialNodeEntityRef;
}>;
export type SpatialNodeCreateUseCaseOutput = SpatialNodeEntity;
export type SpatialNodeCreateManyUseCaseInput = UseCaseRequest<{
	items: ReadonlyArray<{
		parentId: SpatialNodeEntityId | null;
		rect: SpatialNodeEntity["rect"];
		kind: SpatialNodeEntity["kind"];
		ref: SpatialNodeEntityRef;
	}>;
}>;
export type SpatialNodeCreateManyUseCaseOutput = { items: SpatialNodeEntity[] };

@injectable()
export class SpatialNodeCreateUseCase extends BaseUseCase<
	SpatialNodeCreateUseCaseInput,
	SpatialNodeCreateUseCaseOutput
> {
	constructor(
		@inject(AccessControlApplicationService) private readonly access: AccessControlApplicationService,
		@inject(SpatialNodeRepositoryPortToken) private readonly repo: SpatialNodeRepositoryPort,
	) {
		super();
	}
	protected async execute(input: SpatialNodeCreateUseCaseInput): Promise<SpatialNodeCreateUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "create" });
		const scope = input.context.activeWorkspaceScope;
		if (input.dto.parentId !== null) {
			await this.repo.getOne({ filters: [{ id: input.dto.parentId, workspace: scope }] });
		}
		return this.repo.createOne({
			workspace: scope,
			parentId: input.dto.parentId,
			rect: input.dto.rect,
			kind: input.dto.kind,
			ref: input.dto.ref,
		});
	}
}

@injectable()
export class SpatialNodeCreateManyUseCase extends TransactionalUseCase<
	SpatialNodeCreateManyUseCaseInput,
	SpatialNodeCreateManyUseCaseOutput
> {
	constructor(
		@inject(AccessControlApplicationService) private readonly access: AccessControlApplicationService,
		@inject(SpatialNodeRepositoryPortToken) private readonly repo: SpatialNodeRepositoryPort,
		@inject(TransactionManagerPortToken) transactionManager: TransactionManagerPort,
	) {
		super(transactionManager);
	}
	protected async execute(input: SpatialNodeCreateManyUseCaseInput): Promise<SpatialNodeCreateManyUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "create" });
		const scope = input.context.activeWorkspaceScope;
		for (const item of input.dto.items) {
			if (item.parentId !== null) {
				await this.repo.getOne({ filters: [{ id: item.parentId, workspace: scope }] });
			}
		}
		return this.repo.createMany({
			items: input.dto.items.map((item) => ({
				workspace: scope,
				parentId: item.parentId,
				rect: item.rect,
				kind: item.kind,
				ref: item.ref,
			})),
		});
	}
}

export type SpatialNodeGetAllUseCaseInput = UseCaseRequest;
export type SpatialNodeGetAllUseCaseOutput = ItemsContainer<SpatialNodeEntity>;

@injectable()
export class SpatialNodeGetAllUseCase extends BaseUseCase<
	SpatialNodeGetAllUseCaseInput,
	SpatialNodeGetAllUseCaseOutput
> {
	constructor(
		@inject(AccessControlApplicationService) private readonly access: AccessControlApplicationService,
		@inject(SpatialNodeRepositoryPortToken) private readonly repo: SpatialNodeRepositoryPort,
	) {
		super();
	}
	protected async execute(input: SpatialNodeGetAllUseCaseInput): Promise<SpatialNodeGetAllUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "read" });
		const scope = input.context.activeWorkspaceScope;
		return this.repo.getMany({ filters: [{ workspace: scope }] });
	}
}

export type SpatialNodeGetTreeForRootIdUseCaseInput = UseCaseRequest<{ id: SpatialNodeEntityId }>;
export type SpatialNodeGetTreeForRootIdUseCaseOutput = SpatialNodeTreeNode;

@injectable()
export class SpatialNodeGetTreeForRootIdUseCase extends BaseUseCase<
	SpatialNodeGetTreeForRootIdUseCaseInput,
	SpatialNodeGetTreeForRootIdUseCaseOutput
> {
	constructor(
		@inject(AccessControlApplicationService) private readonly access: AccessControlApplicationService,
		@inject(SpatialNodeRepositoryPortToken) private readonly repo: SpatialNodeRepositoryPort,
	) {
		super();
	}
	protected async execute(
		input: SpatialNodeGetTreeForRootIdUseCaseInput,
	): Promise<SpatialNodeGetTreeForRootIdUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "read" });
		const scope = input.context.activeWorkspaceScope;
		await this.repo.getOne({ filters: [{ id: input.dto.id, workspace: scope }] });
		return this.repo.getTreeForRootOne({ filters: [{ id: input.dto.id }] });
	}
}

export type SpatialNodeDeleteUseCaseInput = UseCaseRequest<{ id: SpatialNodeEntityId }>;
export type SpatialNodeDeleteUseCaseOutput = SpatialNodeEntityId;

@injectable()
export class SpatialNodeDeleteUseCase extends BaseUseCase<
	SpatialNodeDeleteUseCaseInput,
	SpatialNodeDeleteUseCaseOutput
> {
	constructor(
		@inject(AccessControlApplicationService) private readonly access: AccessControlApplicationService,
		@inject(SpatialNodeRepositoryPortToken) private readonly repo: SpatialNodeRepositoryPort,
	) {
		super();
	}
	protected async execute(input: SpatialNodeDeleteUseCaseInput): Promise<SpatialNodeDeleteUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "delete" });
		const scope = input.context.activeWorkspaceScope;
		return this.repo.deleteOne({
			filters: [{ id: input.dto.id, workspace: scope }],
		});
	}
}

export type SpatialNodeDeleteManyUseCaseInput = UseCaseRequest<{ ids: SpatialNodeEntityId[] }>;
export type SpatialNodeDeleteManyUseCaseOutput = { count: number };

@injectable()
export class SpatialNodeDeleteManyUseCase extends BaseUseCase<
	SpatialNodeDeleteManyUseCaseInput,
	SpatialNodeDeleteManyUseCaseOutput
> {
	constructor(
		@inject(AccessControlApplicationService) private readonly access: AccessControlApplicationService,
		@inject(SpatialNodeRepositoryPortToken) private readonly repo: SpatialNodeRepositoryPort,
	) {
		super();
	}
	protected async execute(input: SpatialNodeDeleteManyUseCaseInput): Promise<SpatialNodeDeleteManyUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "delete" });
		const scope = input.context.activeWorkspaceScope;
		return this.repo.deleteMany({
			filters: input.dto.ids.map((id) => ({ id, workspace: scope })),
		});
	}
}

export type SpatialNodeRestoreUseCaseInput = UseCaseRequest<{
	id: SpatialNodeEntityId;
	parentId: SpatialNodeEntityId | null;
	rect: SpatialNodeEntity["rect"];
	kind: SpatialNodeEntity["kind"];
	ref: SpatialNodeEntityRef;
}>;
export type SpatialNodeRestoreUseCaseOutput = SpatialNodeEntity;

@injectable()
export class SpatialNodeRestoreUseCase extends BaseUseCase<
	SpatialNodeRestoreUseCaseInput,
	SpatialNodeRestoreUseCaseOutput
> {
	constructor(
		@inject(AccessControlApplicationService) private readonly access: AccessControlApplicationService,
		@inject(SpatialNodeRepositoryPortToken) private readonly repo: SpatialNodeRepositoryPort,
	) {
		super();
	}
	protected async execute(input: SpatialNodeRestoreUseCaseInput): Promise<SpatialNodeRestoreUseCaseOutput> {
		const scope = input.context.activeWorkspaceScope;
		const existing = await getSpatialNodeOrNull(this.repo, scope, input.dto.id);
		if (existing === null) {
			await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "create" });
		} else {
			await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "update" });
		}
		if (input.dto.parentId !== null) {
			await this.repo.getOne({ filters: [{ id: input.dto.parentId, workspace: scope }] });
		}
		return this.repo.restoreOne({
			id: input.dto.id,
			workspace: scope,
			parentId: input.dto.parentId,
			rect: input.dto.rect,
			kind: input.dto.kind,
			ref: input.dto.ref,
		});
	}
}

export type SpatialNodeUpdatePlacementDTO = {
	id: SpatialNodeEntityId;
	parentId: SpatialNodeEntityId | null;
	rect: SpatialNodeEntity["rect"];
};
export type SpatialNodeUpdatePlacementManyUseCaseInput = UseCaseRequest<{
	placements: readonly SpatialNodeUpdatePlacementDTO[];
}>;
export type SpatialNodeUpdatePlacementManyUseCaseOutput = {
	results: SpatialNodeEntity[];
};

@injectable()
export class SpatialNodeUpdatePlacementManyUseCase extends TransactionalUseCase<
	SpatialNodeUpdatePlacementManyUseCaseInput,
	SpatialNodeUpdatePlacementManyUseCaseOutput
> {
	constructor(
		@inject(AccessControlApplicationService) private readonly access: AccessControlApplicationService,
		@inject(SpatialNodeRepositoryPortToken) private readonly repo: SpatialNodeRepositoryPort,
		@inject(SpatialPlacementDomainService) private readonly placementRules: SpatialPlacementDomainService,
		@inject(TransactionManagerPortToken) transactionManager: TransactionManagerPort,
	) {
		super(transactionManager);
	}
	protected async execute(
		input: SpatialNodeUpdatePlacementManyUseCaseInput,
	): Promise<SpatialNodeUpdatePlacementManyUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "update" });
		const scope = input.context.activeWorkspaceScope;
		if (input.dto.placements.length === 0) return { results: [] };

		const byId = new Map<string, SpatialNodeEntity>();
		const loadByIds = async (ids: readonly SpatialNodeEntityId[]) => {
			if (ids.length === 0) return;
			const unresolved = ids.filter((id) => !byId.has(String(id)));
			if (unresolved.length === 0) return;
			const loaded = await this.repo.getManyStrict({
				filters: unresolved.map((id) => ({ id, workspace: scope })),
			});
			for (const row of loaded.items) byId.set(String(row.id), row);
		};

		await loadByIds(input.dto.placements.map((placement) => placement.id));
		const requestedParentIds = input.dto.placements
			.map((op) => op.parentId)
			.filter((id): id is SpatialNodeEntityId => id !== null);
		let pendingAncestors = [...new Set(requestedParentIds.map((id) => String(id)))].map(
			(id) => id as unknown as SpatialNodeEntityId,
		);
		while (pendingAncestors.length > 0) {
			await loadByIds(pendingAncestors);
			const next = new Set<string>();
			for (const id of pendingAncestors) {
				const row = byId.get(String(id));
				if (row && row.parentId !== null && !byId.has(String(row.parentId))) {
					next.add(String(row.parentId));
				}
			}
			pendingAncestors = [...next].map((id) => id as unknown as SpatialNodeEntityId);
		}

		const parentById = new Map([...byId.values()].map((row) => [String(row.id), row.parentId] as const));
		for (const placement of input.dto.placements) {
			this.placementRules.assertNoSelfParenting({ nodeId: placement.id, parentId: placement.parentId });
			this.placementRules.assertNoCycle({
				nodeId: placement.id,
				parentId: placement.parentId,
				parentById,
			});
			parentById.set(String(placement.id), placement.parentId);
		}

		const groups = new Map<
			string,
			{
				dto: { parentId: SpatialNodeEntityId | null; rect: SpatialNodeEntity["rect"] };
				ids: SpatialNodeEntityId[];
			}
		>();
		for (const placement of input.dto.placements) {
			const key = `${placement.parentId ?? "null"}:${placement.rect.x}:${placement.rect.y}:${placement.rect.width}:${placement.rect.height}`;
			const existing = groups.get(key);
			if (existing) {
				existing.ids.push(placement.id);
				continue;
			}
			groups.set(key, {
				dto: {
					parentId: placement.parentId,
					rect: placement.rect,
				},
				ids: [placement.id],
			});
		}

		for (const group of groups.values()) {
			await this.repo.updateMany({
				filters: group.ids.map((id) => ({ id, workspace: scope })),
				dto: group.dto,
			});
		}

		const persisted = await this.repo.getManyStrict({
			filters: input.dto.placements.map((placement) => ({ id: placement.id, workspace: scope })),
		});
		const persistedById = new Map(persisted.items.map((row) => [String(row.id), row] as const));
		// getManyStrict above guarantees all requested ids exist.
		const results = input.dto.placements.map(
			(placement) => persistedById.get(String(placement.id)) as SpatialNodeEntity,
		);
		return { results };
	}
}
