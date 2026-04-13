import { WorkspaceVO } from "@backend/core/domain/access/workspace.vo";
import type { SpeciesCategoryEntity, SpeciesCategoryEntityId } from "@backend/core/domain/gardening/entities";
import type {
	SpeciesCategoryRepositoryCreateInputDTO,
	SpeciesCategoryRepositoryDeleteOutputDTO,
	SpeciesCategoryRepositoryPort,
	SpeciesCategoryRepositoryUpdateOutputDTO,
	SpeciesCategoryRepositoryUpdatePatchDTO,
} from "../../ports/repositories/gardening/species-category.repository.port";
import type { AccessControlApplicationService } from "../../services/access-control/access-control.application-service";
import type { IUseCase } from "../shared/use-case.interface";
import type { UseCaseRequest } from "../use-case-context";

export type SpeciesCategoryWithSystemCatalog = SpeciesCategoryEntity & { systemCatalog: boolean };

type SpeciesCategoryCreatePayload = Omit<SpeciesCategoryRepositoryCreateInputDTO, "workspace">;
export type SpeciesCategoryCreateUseCaseInput = UseCaseRequest<SpeciesCategoryCreatePayload>;
export type SpeciesCategoryCreateUseCaseOutput = SpeciesCategoryWithSystemCatalog;

export class SpeciesCategoryCreateUseCase
	implements IUseCase<SpeciesCategoryCreateUseCaseInput, SpeciesCategoryCreateUseCaseOutput>
{
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly speciesCategoryRepository: SpeciesCategoryRepositoryPort,
	) {}

	public async execute(input: SpeciesCategoryCreateUseCaseInput): Promise<SpeciesCategoryCreateUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "create" });
		const created = await this.speciesCategoryRepository.createOne({
			...input.dto,
			workspace: input.context.activeWorkspaceScope,
		});
		return { ...created, systemCatalog: WorkspaceVO.isGlobalShared(created.workspace) };
	}
}

export type SpeciesCategoryGetByIdUseCaseInput = UseCaseRequest<{ id: SpeciesCategoryEntityId }>;
export type SpeciesCategoryGetByIdUseCaseOutput = SpeciesCategoryWithSystemCatalog;

export class SpeciesCategoryGetByIdUseCase
	implements IUseCase<SpeciesCategoryGetByIdUseCaseInput, SpeciesCategoryGetByIdUseCaseOutput>
{
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly speciesCategoryRepository: SpeciesCategoryRepositoryPort,
	) {}

	public async execute(input: SpeciesCategoryGetByIdUseCaseInput): Promise<SpeciesCategoryGetByIdUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "read" });
		const scope = input.context.activeWorkspaceScope;
		const row = await this.speciesCategoryRepository.getOne({
			filters: [{ id: input.dto.id, workspace: scope }],
		});
		return { ...row, systemCatalog: WorkspaceVO.isGlobalShared(row.workspace) };
	}
}

export type SpeciesCategoryGetAllUseCaseInput = UseCaseRequest;
export type SpeciesCategoryGetAllUseCaseOutput = {
	items: SpeciesCategoryWithSystemCatalog[];
};

export class SpeciesCategoryGetAllUseCase
	implements IUseCase<SpeciesCategoryGetAllUseCaseInput, SpeciesCategoryGetAllUseCaseOutput>
{
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly speciesCategoryRepository: SpeciesCategoryRepositoryPort,
	) {}
	public async execute(input: SpeciesCategoryGetAllUseCaseInput): Promise<SpeciesCategoryGetAllUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({
			...input.context,
			action: "read",
		});
		const active = input.context.activeWorkspaceScope;
		const global = WorkspaceVO.globalShared();
		const all = await this.speciesCategoryRepository.getMany({
			filters: [{ workspace: active }, { workspace: global }],
		});
		const enriched = all.items.map((item) => ({
			...item,
			systemCatalog: WorkspaceVO.isGlobalShared(item.workspace),
		}));
		return { items: enriched };
	}
}

export type SpeciesCategoryUpdateUseCaseInput = UseCaseRequest<
	{ id: SpeciesCategoryEntityId } & SpeciesCategoryRepositoryUpdatePatchDTO
>;
export type SpeciesCategoryUpdateUseCaseOutput = SpeciesCategoryWithSystemCatalog;

export class SpeciesCategoryUpdateUseCase
	implements IUseCase<SpeciesCategoryUpdateUseCaseInput, SpeciesCategoryUpdateUseCaseOutput>
{
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly speciesCategoryRepository: SpeciesCategoryRepositoryPort,
	) {}
	public async execute(input: SpeciesCategoryUpdateUseCaseInput): Promise<SpeciesCategoryUpdateUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "update" });
		const scope = input.context.activeWorkspaceScope;
		const { id, ...patch } = input.dto;
		const updated = await this.speciesCategoryRepository.updateOne({
			filters: [{ id, workspace: scope }],
			dto: patch,
		});
		return { ...updated, systemCatalog: WorkspaceVO.isGlobalShared(updated.workspace) };
	}
}

export type SpeciesCategoryDeleteUseCaseInput = UseCaseRequest<{ id: SpeciesCategoryEntityId }>;
export type SpeciesCategoryDeleteUseCaseOutput = SpeciesCategoryRepositoryDeleteOutputDTO;

export class SpeciesCategoryDeleteUseCase
	implements IUseCase<SpeciesCategoryDeleteUseCaseInput, SpeciesCategoryDeleteUseCaseOutput>
{
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly speciesCategoryRepository: SpeciesCategoryRepositoryPort,
	) {}
	public async execute(input: SpeciesCategoryDeleteUseCaseInput): Promise<SpeciesCategoryDeleteUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "delete" });
		const scope = input.context.activeWorkspaceScope;
		return this.speciesCategoryRepository.deleteOne({
			filters: [{ id: input.dto.id, workspace: scope }],
		});
	}
}
