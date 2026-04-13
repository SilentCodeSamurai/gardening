import { WorkspaceVO } from "@backend/core/domain/access/workspace.vo";
import type { CultivarEntityId } from "@backend/core/domain/gardening/entities";
import type {
	CultivarRepositoryPort,
	CultivarRepositoryCreateInputDTO,
	CultivarRepositoryCreateOutputDTO,
	CultivarRepositoryDeleteOutputDTO,
	CultivarRepositoryGetFullOutputDTO,
	CultivarRepositoryGetManyOutputDTO,
	CultivarRepositoryUpdateOutputDTO,
	CultivarRepositoryUpdatePatchDTO,
} from "../../ports/repositories/gardening/cultivar.repository.port";
import type { AccessControlApplicationService } from "../../services/access-control/access-control.application-service";
import type { IUseCase } from "../shared/use-case.interface";
import type { UseCaseRequest } from "../use-case-context";

import type { SpeciesWithSystemCatalog } from "./species.use-cases";

export type CultivarGetFullByIdUseCaseOutput = CultivarRepositoryGetFullOutputDTO & {
	species: SpeciesWithSystemCatalog;
};

type CultivarCreatePayload = Omit<CultivarRepositoryCreateInputDTO, "workspace">;
export type CultivarCreateUseCaseInput = UseCaseRequest<CultivarCreatePayload>;
export type CultivarCreateUseCaseOutput = CultivarRepositoryCreateOutputDTO;

export class CultivarCreateUseCase implements IUseCase<CultivarCreateUseCaseInput, CultivarCreateUseCaseOutput> {
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly cultivarRepository: CultivarRepositoryPort,
	) {}
	public async execute(input: CultivarCreateUseCaseInput): Promise<CultivarCreateUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "create" });
		return this.cultivarRepository.createOne({
			...input.dto,
			workspace: input.context.activeWorkspaceScope,
		});
	}
}

export type CultivarGetByIdUseCaseInput = UseCaseRequest<{ id: CultivarEntityId }>;
export type CultivarGetByIdUseCaseOutput = CultivarRepositoryCreateOutputDTO;

export class CultivarGetByIdUseCase implements IUseCase<CultivarGetByIdUseCaseInput, CultivarGetByIdUseCaseOutput> {
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly cultivarRepository: CultivarRepositoryPort,
	) {}
	public async execute(input: CultivarGetByIdUseCaseInput): Promise<CultivarGetByIdUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "read" });
		const scope = input.context.activeWorkspaceScope;
		return this.cultivarRepository.getOne({ filters: [{ id: input.dto.id, workspace: scope }] });
	}
}

export type CultivarGetFullByIdUseCaseInput = UseCaseRequest<{ id: CultivarEntityId }>;

export class CultivarGetFullByIdUseCase
	implements IUseCase<CultivarGetFullByIdUseCaseInput, CultivarGetFullByIdUseCaseOutput>
{
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly cultivarRepository: CultivarRepositoryPort,
	) {}
	public async execute(input: CultivarGetFullByIdUseCaseInput): Promise<CultivarGetFullByIdUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "read" });
		const scope = input.context.activeWorkspaceScope;
		const item = await this.cultivarRepository.getFullOne({ filters: [{ id: input.dto.id, workspace: scope }] });
		return {
			...item,
			species: {
				...item.species,
				systemCatalog: WorkspaceVO.isGlobalShared(item.species.workspace),
			},
		};
	}
}

export type CultivarGetAllUseCaseInput = UseCaseRequest;
export type CultivarGetAllUseCaseOutput = CultivarRepositoryGetManyOutputDTO;

export class CultivarGetAllUseCase implements IUseCase<CultivarGetAllUseCaseInput, CultivarGetAllUseCaseOutput> {
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly cultivarRepository: CultivarRepositoryPort,
	) {}
	public async execute(input: CultivarGetAllUseCaseInput): Promise<CultivarGetAllUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({
			...input.context,
			action: "read",
		});
		const active = input.context.activeWorkspaceScope;
		const global = WorkspaceVO.globalShared();
		return this.cultivarRepository.getMany({
			filters: [{ workspace: active }, { workspace: global }],
		});
	}
}

export type CultivarUpdateUseCaseInput = UseCaseRequest<
	{ id: CultivarEntityId } & CultivarRepositoryUpdatePatchDTO
>;
export type CultivarUpdateUseCaseOutput = CultivarRepositoryUpdateOutputDTO;

export class CultivarUpdateUseCase implements IUseCase<CultivarUpdateUseCaseInput, CultivarUpdateUseCaseOutput> {
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly cultivarRepository: CultivarRepositoryPort,
	) {}
	public async execute(input: CultivarUpdateUseCaseInput): Promise<CultivarUpdateUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "update" });
		const scope = input.context.activeWorkspaceScope;
		const { id, ...patch } = input.dto;
		return this.cultivarRepository.updateOne({
			filters: [{ id, workspace: scope }],
			dto: patch,
		});
	}
}

export type CultivarDeleteUseCaseInput = UseCaseRequest<{ id: CultivarEntityId }>;
export type CultivarDeleteUseCaseOutput = CultivarRepositoryDeleteOutputDTO;

export class CultivarDeleteUseCase implements IUseCase<CultivarDeleteUseCaseInput, CultivarDeleteUseCaseOutput> {
	constructor(
		private readonly access: AccessControlApplicationService,
		private readonly cultivarRepository: CultivarRepositoryPort,
	) {}
	public async execute(input: CultivarDeleteUseCaseInput): Promise<CultivarDeleteUseCaseOutput> {
		await this.access.assertCanPerformActionOnWorkspace({ ...input.context, action: "delete" });
		const scope = input.context.activeWorkspaceScope;
		return this.cultivarRepository.deleteOne({
			filters: [{ id: input.dto.id, workspace: scope }],
		});
	}
}
