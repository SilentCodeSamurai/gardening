import { WorkspaceVO } from "@backend/core/domain/access/workspace.vo";
import type { SpeciesEntity, SpeciesEntityId } from "@backend/core/domain/gardening/entities";
import type {
	SpeciesRepositoryPort,
	SpeciesRepositoryCreateInputDTO,
	SpeciesRepositoryDeleteOutputDTO,
	SpeciesRepositoryUpdateOutputDTO,
	SpeciesRepositoryUpdatePatchDTO,
} from "../../ports/repositories/gardening/species.repository.port";
import type { AccessControlApplicationService } from "../../services/access-control/access-control.application-service";
import type { IUseCase } from "../shared/use-case.interface";
import type { UseCaseRequest } from "../use-case-context";

export type SpeciesWithSystemCatalog = SpeciesEntity & { systemCatalog: boolean };

type SpeciesCreatePayload = Omit<SpeciesRepositoryCreateInputDTO, "workspace">;
export type SpeciesCreateUseCaseInput = UseCaseRequest<SpeciesCreatePayload>;
export type SpeciesCreateUseCaseOutput = SpeciesWithSystemCatalog;

export class SpeciesCreateUseCase implements IUseCase<SpeciesCreateUseCaseInput, SpeciesCreateUseCaseOutput> {
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly speciesRepository: SpeciesRepositoryPort,
	) {}

	public async execute(input: SpeciesCreateUseCaseInput): Promise<SpeciesCreateUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "create" });
		const created = await this.speciesRepository.createOne({
			...input.dto,
			workspace: input.context.activeWorkspaceScope,
		});
		return { ...created, systemCatalog: WorkspaceVO.isGlobalShared(created.workspace) };
	}
}

export type SpeciesGetByIdUseCaseInput = UseCaseRequest<{ id: SpeciesEntityId }>;
export type SpeciesGetByIdUseCaseOutput = SpeciesWithSystemCatalog;

export class SpeciesGetByIdUseCase implements IUseCase<SpeciesGetByIdUseCaseInput, SpeciesGetByIdUseCaseOutput> {
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly speciesRepository: SpeciesRepositoryPort,
	) {}

	public async execute(input: SpeciesGetByIdUseCaseInput): Promise<SpeciesGetByIdUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "read" });
		const scope = input.context.activeWorkspaceScope;
		const row = await this.speciesRepository.getOne({ filters: [{ id: input.dto.id, workspace: scope }] });
		return { ...row, systemCatalog: WorkspaceVO.isGlobalShared(row.workspace) };
	}
}

export type SpeciesGetAllUseCaseInput = UseCaseRequest;
export type SpeciesGetAllUseCaseOutput = { items: SpeciesWithSystemCatalog[] };

export class SpeciesGetAllUseCase implements IUseCase<SpeciesGetAllUseCaseInput, SpeciesGetAllUseCaseOutput> {
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly speciesRepository: SpeciesRepositoryPort,
	) {}

	public async execute(input: SpeciesGetAllUseCaseInput): Promise<SpeciesGetAllUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({
			...input.context,
			action: "read",
		});
		const active = input.context.activeWorkspaceScope;
		const global = WorkspaceVO.globalShared();
		const all = await this.speciesRepository.getMany({
			filters: [{ workspace: active }, { workspace: global }],
		});
		const enriched = all.items.map((item) => ({
			...item,
			systemCatalog: WorkspaceVO.isGlobalShared(item.workspace),
		}));
		return { items: enriched };
	}
}

export type SpeciesUpdateUseCaseInput = UseCaseRequest<{ id: SpeciesEntityId } & SpeciesRepositoryUpdatePatchDTO>;
export type SpeciesUpdateUseCaseOutput = SpeciesWithSystemCatalog;

export class SpeciesUpdateUseCase implements IUseCase<SpeciesUpdateUseCaseInput, SpeciesUpdateUseCaseOutput> {
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly speciesRepository: SpeciesRepositoryPort,
	) {}

	public async execute(input: SpeciesUpdateUseCaseInput): Promise<SpeciesUpdateUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "update" });
		const scope = input.context.activeWorkspaceScope;
		const { id, ...patch } = input.dto;
		const updated = await this.speciesRepository.updateOne({
			filters: [{ id, workspace: scope }],
			dto: patch,
		});
		return { ...updated, systemCatalog: WorkspaceVO.isGlobalShared(updated.workspace) };
	}
}

export type SpeciesDeleteUseCaseInput = UseCaseRequest<{ id: SpeciesEntityId }>;
export type SpeciesDeleteUseCaseOutput = SpeciesRepositoryDeleteOutputDTO;

export class SpeciesDeleteUseCase implements IUseCase<SpeciesDeleteUseCaseInput, SpeciesDeleteUseCaseOutput> {
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly speciesRepository: SpeciesRepositoryPort,
	) {}

	public async execute(input: SpeciesDeleteUseCaseInput): Promise<SpeciesDeleteUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "delete" });
		const scope = input.context.activeWorkspaceScope;
		return this.speciesRepository.deleteOne({
			filters: [{ id: input.dto.id, workspace: scope }],
		});
	}
}
