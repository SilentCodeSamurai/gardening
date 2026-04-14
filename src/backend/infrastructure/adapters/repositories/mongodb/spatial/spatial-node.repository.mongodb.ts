import type {
	SpatialNodeRepositoryCreateInputDTO,
	SpatialNodeRepositoryCreateManyInputDTO,
	SpatialNodeRepositoryCreateManyOutputDTO,
	SpatialNodeRepositoryCreateOutputDTO,
	SpatialNodeRepositoryDeleteManyOutputDTO,
	SpatialNodeRepositoryDeleteOutputDTO,
	SpatialNodeRepositoryFilterClause,
	SpatialNodeRepositoryGetByRefFilterClause,
	SpatialNodeRepositoryGetManyOutputDTO,
	SpatialNodeRepositoryGetOneOutputDTO,
	SpatialNodeRepositoryPort,
	SpatialNodeRepositoryRestoreInputDTO,
	SpatialNodeRepositoryTreeRootFilterClause,
	SpatialNodeRepositoryUpdateManyOutputDTO,
	SpatialNodeRepositoryUpdateOutputDTO,
	SpatialNodeRepositoryUpdatePatchDTO,
} from "@backend/core/application/ports/repositories/spatial/spatial-node.repository.port";
import type { SpatialNodeEntity, SpatialNodeTreeNode } from "@backend/core/domain/spatial/entities";
import { TransactionManagerMongoDB } from "@backend/infrastructure/adapters/transaction/transaction-manager.mongodb";
import { MongoDBDatabaseNameToken } from "@backend/infrastructure/integrations/mongodb/injection-tokens";
import { spatialNodeId } from "@backend/infrastructure/integrations/shared/database-ids";
import { inject, injectable } from "tsyringe";
import { BaseMongoDBRepository } from "../shared/base-mongodb.repository";
import { MONGODB_COLLECTION_TYPE } from "../shared/mongodb.constants";
import { MONGODB_MAPPERS } from "../shared/mongodb.mappers";
import type { SpatialNodeDoc } from "../shared/mongodb.models";

@injectable()
export class SpatialNodeMongoDBRepository extends BaseMongoDBRepository implements SpatialNodeRepositoryPort {
	constructor(
		@inject(TransactionManagerMongoDB) tx: TransactionManagerMongoDB,
		@inject(MongoDBDatabaseNameToken) databaseName: string,
	) {
		super(tx, databaseName);
	}

	async createOne(dto: SpatialNodeRepositoryCreateInputDTO): Promise<SpatialNodeRepositoryCreateOutputDTO> {
		const collection = this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES);
		if (dto.parentId !== null) {
			const parent = await collection.findOne({ id: dto.parentId }, { session: this.tx.session });
			if (!parent) this.throwNotFoundError("SpatialNode", dto.parentId);
		}
		const now = new Date();
		const doc: SpatialNodeDoc = {
			...dto,
			id: spatialNodeId(),
			createdAt: now,
			updatedAt: now,
			workspaceKey: dto.workspace.toKey(),
		};
		await collection.insertOne(doc, { session: this.tx.session });
		return MONGODB_MAPPERS.spatialNode(doc);
	}
	async createMany(
		input: SpatialNodeRepositoryCreateManyInputDTO,
	): Promise<SpatialNodeRepositoryCreateManyOutputDTO> {
		if (input.items.length === 0) return { count: 0 };
		for (const item of input.items) {
			if (item.parentId !== null) {
				const parent = await this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES).findOne(
					{ id: item.parentId },
					{ session: this.tx.session },
				);
				if (!parent) this.throwNotFoundError("SpatialNode", item.parentId);
			}
		}
		const now = new Date();
		const docs: SpatialNodeDoc[] = input.items.map((item) => ({
			...item,
			id: spatialNodeId(),
			createdAt: now,
			updatedAt: now,
			workspaceKey: item.workspace.toKey(),
		}));
		await this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES).insertMany(docs, {
			session: this.tx.session,
		});
		return { count: input.items.length };
	}
	async getOne(input: {
		filters: readonly SpatialNodeRepositoryFilterClause[];
	}): Promise<SpatialNodeRepositoryGetOneOutputDTO> {
		const doc = await this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES).findOne(this.filters(input.filters), {
			session: this.tx.session,
		});
		if (!doc) this.throwNotFoundError("SpatialNode", input.filters);
		return MONGODB_MAPPERS.spatialNode(doc);
	}
	async getOneByRef(input: {
		filters: readonly SpatialNodeRepositoryGetByRefFilterClause[];
	}): Promise<SpatialNodeRepositoryGetOneOutputDTO> {
		const or = input.filters.map((f) => ({
			"ref.entity": f.ref.entity,
			"ref.entityId": f.ref.entityId,
		}));
		const doc = await this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES).findOne(
			{ $or: or },
			{ session: this.tx.session },
		);
		if (!doc) this.throwNotFoundError("SpatialNodeRef", input.filters);
		return MONGODB_MAPPERS.spatialNode(doc);
	}
	async getMany(input?: {
		filters?: readonly SpatialNodeRepositoryFilterClause[];
	}): Promise<SpatialNodeRepositoryGetManyOutputDTO> {
		if (input?.filters === undefined) {
			const docs = await this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES)
				.find({}, { session: this.tx.session })
				.toArray();
			return { items: docs.map(MONGODB_MAPPERS.spatialNode) };
		}
		if (input.filters.length === 0) return { items: [] };
		const docs = await this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES)
			.find(this.filters(input.filters), { session: this.tx.session })
			.toArray();
		return { items: docs.map(MONGODB_MAPPERS.spatialNode) };
	}
	async updateOne(input: {
		filters: readonly SpatialNodeRepositoryFilterClause[];
		dto: SpatialNodeRepositoryUpdatePatchDTO;
	}): Promise<SpatialNodeRepositoryUpdateOutputDTO> {
		const row = await this.getOne({ filters: input.filters });
		const collection = this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES);
		const updated = { ...row, ...input.dto, updatedAt: new Date() };
		if (updated.parentId !== null) {
			const parent = await collection.findOne({ id: updated.parentId }, { session: this.tx.session });
			if (!parent) this.throwNotFoundError("SpatialNode", updated.parentId);
		}
		await collection.replaceOne(
			{ id: row.id },
			{ ...updated, workspaceKey: updated.workspace.toKey() },
			{ session: this.tx.session },
		);
		return updated;
	}
	async updateMany(input: {
		filters: readonly SpatialNodeRepositoryFilterClause[];
		dto: SpatialNodeRepositoryUpdatePatchDTO;
	}): Promise<SpatialNodeRepositoryUpdateManyOutputDTO> {
		if (input.dto.parentId !== undefined && input.dto.parentId !== null) {
			const parent = await this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES).findOne(
				{ id: input.dto.parentId },
				{ session: this.tx.session },
			);
			if (!parent) this.throwNotFoundError("SpatialNode", input.dto.parentId);
		}
		const dtoDoc = { ...input.dto } as Record<string, unknown>;
		if (input.dto.workspace !== undefined) {
			dtoDoc.workspaceKey = input.dto.workspace.toKey();
			delete dtoDoc.workspace;
		}
		dtoDoc.updatedAt = new Date();
		const result = await this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES).updateMany(
			this.filters(input.filters),
			{ $set: dtoDoc },
			{ session: this.tx.session },
		);
		return { count: result.modifiedCount };
	}
	async deleteOne(input: {
		filters: readonly SpatialNodeRepositoryFilterClause[];
	}): Promise<SpatialNodeRepositoryDeleteOutputDTO> {
		const row = await this.getOne({ filters: input.filters });
		const collection = this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES);
		const hasChild = await collection.findOne({ parentId: row.id }, { session: this.tx.session });
		if (hasChild) {
			this.throwConflictError({
				operation: "delete",
				reason: "child-nodes-exist",
				i18nMessageKey: "errors_application_repository_conflict_spatial_node_delete_child_nodes_exist",
				message: "Cannot delete spatial node: child nodes exist.",
			});
		}
		await collection.deleteOne({ id: row.id }, { session: this.tx.session });
		return row.id;
	}
	async deleteMany(input: {
		filters: readonly SpatialNodeRepositoryFilterClause[];
	}): Promise<SpatialNodeRepositoryDeleteManyOutputDTO> {
		const rows = (await this.getMany({ filters: input.filters })).items;
		const collection = this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES);
		let count = 0;
		for (const row of rows) {
			const hasChild = await collection.findOne({ parentId: row.id }, { session: this.tx.session });
			if (hasChild) continue;
			await collection.deleteOne({ id: row.id }, { session: this.tx.session });
			count += 1;
		}
		return { count };
	}
	async restoreOne(input: SpatialNodeRepositoryRestoreInputDTO): Promise<SpatialNodeEntity> {
		const collection = this.collection(MONGODB_COLLECTION_TYPE.SPATIAL_NODES);
		if (input.parentId !== null) {
			const parent = await collection.findOne({ id: input.parentId }, { session: this.tx.session });
			if (!parent) this.throwNotFoundError("SpatialNode", input.parentId);
		}
		const now = new Date();
		const existing = await collection.findOne({ id: input.id }, { session: this.tx.session });
		const doc: SpatialNodeDoc = {
			...input,
			createdAt: existing?.createdAt ?? now,
			updatedAt: now,
			workspaceKey: input.workspace.toKey(),
		};
		await collection.replaceOne({ id: input.id }, doc, { upsert: true, session: this.tx.session });
		return MONGODB_MAPPERS.spatialNode(doc);
	}
	async getTreeForRootOne(input: {
		filters: readonly SpatialNodeRepositoryTreeRootFilterClause[];
	}): Promise<SpatialNodeTreeNode> {
		const root = await this.getOne({ filters: input.filters as readonly SpatialNodeRepositoryFilterClause[] });
		const all = (await this.getMany()).items;
		const byParent = new Map<string, SpatialNodeEntity[]>();
		for (const item of all) {
			const parentKey = item.parentId === null ? "__root__" : String(item.parentId);
			const bucket = byParent.get(parentKey) ?? [];
			bucket.push(item);
			byParent.set(parentKey, bucket);
		}
		const build = (node: SpatialNodeEntity): SpatialNodeTreeNode => ({
			...node,
			children: (byParent.get(String(node.id)) ?? []).map(build),
		});
		return build(root);
	}
}
