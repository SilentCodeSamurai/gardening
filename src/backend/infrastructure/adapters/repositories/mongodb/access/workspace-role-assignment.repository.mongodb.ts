import type {
	WorkspaceRoleAssignmentRepositoryCreateInputDTO,
	WorkspaceRoleAssignmentRepositoryCreateManyInputDTO,
	WorkspaceRoleAssignmentRepositoryCreateManyOutputDTO,
	WorkspaceRoleAssignmentRepositoryCreateOutputDTO,
	WorkspaceRoleAssignmentRepositoryDeleteManyOutputDTO,
	WorkspaceRoleAssignmentRepositoryDeleteOutputDTO,
	WorkspaceRoleAssignmentRepositoryFilterClause,
	WorkspaceRoleAssignmentRepositoryGetManyOutputDTO,
	WorkspaceRoleAssignmentRepositoryGetOneOutputDTO,
	WorkspaceRoleAssignmentRepositoryPort,
	WorkspaceRoleAssignmentRepositoryUpdateManyOutputDTO,
	WorkspaceRoleAssignmentRepositoryUpdateOutputDTO,
	WorkspaceRoleAssignmentRepositoryUpdatePatchDTO,
	WorkspaceRoleAssignmentRepositoryUpsertInputDTO,
	WorkspaceRoleAssignmentRepositoryUpsertOutputDTO,
} from "@backend/core/application/ports/repositories/access/workspace-role-assignment.repository.port";
import { TransactionManagerMongoDB } from "@backend/infrastructure/adapters/transaction/transaction-manager.mongodb";
import { MongoDBDatabaseNameToken } from "@backend/infrastructure/integrations/mongodb/injection-tokens";
import { workspaceRoleAssignmentId } from "@backend/infrastructure/integrations/shared/database-ids";
import { inject, injectable } from "tsyringe";
import { BaseMongoDBRepository } from "../shared/base-mongodb.repository";
import { MONGODB_COLLECTION_TYPE } from "../shared/mongodb.constants";
import { MONGODB_MAPPERS } from "../shared/mongodb.mappers";
import type { WorkspaceRoleAssignmentDoc } from "../shared/mongodb.models";

@injectable()
export class WorkspaceRoleAssignmentMongoDBRepository
	extends BaseMongoDBRepository
	implements WorkspaceRoleAssignmentRepositoryPort
{
	constructor(
		@inject(TransactionManagerMongoDB) tx: TransactionManagerMongoDB,
		@inject(MongoDBDatabaseNameToken) databaseName: string,
	) {
		super(tx, databaseName);
	}

	async createOne(
		dto: WorkspaceRoleAssignmentRepositoryCreateInputDTO,
	): Promise<WorkspaceRoleAssignmentRepositoryCreateOutputDTO> {
		const collection = this.collection(MONGODB_COLLECTION_TYPE.WORKSPACE_ROLE_ASSIGNMENTS);
		const subjectKey = dto.subject.toKey();
		const workspaceKey = dto.workspace.toKey();
		const existing = await collection.findOne({ subjectKey, workspaceKey }, { session: this.tx.session });
		if (existing) {
			this.throwConflictError({
				operation: "create",
				reason: "duplicate-subject-workspace",
				i18nMessageKey: "errors_application_repository_conflict_workspace_role_create_duplicate",
				message: "Workspace role assignment already exists for this subject and workspace.",
			});
		}
		const now = new Date();
		const doc: WorkspaceRoleAssignmentDoc = {
			...dto,
			id: workspaceRoleAssignmentId(),
			createdAt: now,
			updatedAt: now,
			subjectKey,
			workspaceKey,
		};
		await collection.insertOne(doc, { session: this.tx.session });
		return MONGODB_MAPPERS.workspaceRoleAssignment(doc);
	}
	async createMany(
		input: WorkspaceRoleAssignmentRepositoryCreateManyInputDTO,
	): Promise<WorkspaceRoleAssignmentRepositoryCreateManyOutputDTO> {
		let count = 0;
		for (const item of input.items) {
			await this.createOne(item);
			count += 1;
		}
		return { count };
	}
	async upsertOne(
		input: WorkspaceRoleAssignmentRepositoryUpsertInputDTO,
	): Promise<WorkspaceRoleAssignmentRepositoryUpsertOutputDTO> {
		const collection = this.collection(MONGODB_COLLECTION_TYPE.WORKSPACE_ROLE_ASSIGNMENTS);
		const subjectKey = input.subject.toKey();
		const workspaceKey = input.workspace.toKey();
		const existing = await collection.findOne({ subjectKey, workspaceKey }, { session: this.tx.session });
		if (!existing) {
			return this.createOne({
				subject: input.subject,
				workspace: input.workspace,
				role: input.role,
				grantSource: input.grantSource,
			});
		}
		return this.updateOne({
			filters: [{ id: existing.id }],
			dto: {
				role: input.role,
				...(input.grantSource !== undefined ? { grantSource: input.grantSource } : {}),
			},
		});
	}
	async getOne(input: {
		filters: readonly WorkspaceRoleAssignmentRepositoryFilterClause[];
	}): Promise<WorkspaceRoleAssignmentRepositoryGetOneOutputDTO> {
		const doc = await this.collection(MONGODB_COLLECTION_TYPE.WORKSPACE_ROLE_ASSIGNMENTS).findOne(
			this.filters(input.filters),
			{ session: this.tx.session },
		);
		if (!doc) this.throwNotFoundError("WorkspaceRoleAssignment", input.filters);
		return MONGODB_MAPPERS.workspaceRoleAssignment(doc);
	}
	async getMany(input?: {
		filters?: readonly WorkspaceRoleAssignmentRepositoryFilterClause[];
	}): Promise<WorkspaceRoleAssignmentRepositoryGetManyOutputDTO> {
		if (input?.filters === undefined) {
			const docs = await this.collection(MONGODB_COLLECTION_TYPE.WORKSPACE_ROLE_ASSIGNMENTS)
				.find({}, { session: this.tx.session })
				.toArray();
			return { items: docs.map(MONGODB_MAPPERS.workspaceRoleAssignment) };
		}
		if (input.filters.length === 0) return { items: [] };
		const docs = await this.collection(MONGODB_COLLECTION_TYPE.WORKSPACE_ROLE_ASSIGNMENTS)
			.find(this.filters(input.filters), { session: this.tx.session })
			.toArray();
		return { items: docs.map(MONGODB_MAPPERS.workspaceRoleAssignment) };
	}
	async updateOne(input: {
		filters: readonly WorkspaceRoleAssignmentRepositoryFilterClause[];
		dto: WorkspaceRoleAssignmentRepositoryUpdatePatchDTO;
	}): Promise<WorkspaceRoleAssignmentRepositoryUpdateOutputDTO> {
		const collection = this.collection(MONGODB_COLLECTION_TYPE.WORKSPACE_ROLE_ASSIGNMENTS);
		const row = await this.getOne({ filters: input.filters });
		const updated = { ...row, ...input.dto, updatedAt: new Date() };
		const nextSubjectKey = updated.subject.toKey();
		const nextWorkspaceKey = updated.workspace.toKey();
		const occupant = await collection.findOne(
			{ subjectKey: nextSubjectKey, workspaceKey: nextWorkspaceKey },
			{ session: this.tx.session },
		);
		if (occupant && occupant.id !== row.id) {
			this.throwConflictError({
				operation: "update",
				reason: "duplicate-subject-workspace",
				i18nMessageKey: "errors_application_repository_conflict_workspace_role_update_duplicate",
				message: "Another assignment already uses this subject and workspace pair.",
			});
		}
		await collection.replaceOne(
			{ id: row.id },
			{
				...updated,
				subjectKey: nextSubjectKey,
				workspaceKey: nextWorkspaceKey,
			},
			{ session: this.tx.session },
		);
		return updated;
	}
	async updateMany(input: {
		filters: readonly WorkspaceRoleAssignmentRepositoryFilterClause[];
		dto: WorkspaceRoleAssignmentRepositoryUpdatePatchDTO;
	}): Promise<WorkspaceRoleAssignmentRepositoryUpdateManyOutputDTO> {
		const rows = (await this.getMany({ filters: input.filters })).items;
		let count = 0;
		for (const row of rows) {
			await this.updateOne({ filters: [{ id: row.id }], dto: input.dto });
			count += 1;
		}
		return { count };
	}
	async deleteOne(input: {
		filters: readonly WorkspaceRoleAssignmentRepositoryFilterClause[];
	}): Promise<WorkspaceRoleAssignmentRepositoryDeleteOutputDTO> {
		const row = await this.getOne({ filters: input.filters });
		await this.collection(MONGODB_COLLECTION_TYPE.WORKSPACE_ROLE_ASSIGNMENTS).deleteOne(
			{ id: row.id },
			{ session: this.tx.session },
		);
		return row.id;
	}
	async deleteMany(input: {
		filters: readonly WorkspaceRoleAssignmentRepositoryFilterClause[];
	}): Promise<WorkspaceRoleAssignmentRepositoryDeleteManyOutputDTO> {
		const result = await this.collection(MONGODB_COLLECTION_TYPE.WORKSPACE_ROLE_ASSIGNMENTS).deleteMany(
			this.filters(input.filters),
			{ session: this.tx.session },
		);
		return { count: result.deletedCount };
	}
}
