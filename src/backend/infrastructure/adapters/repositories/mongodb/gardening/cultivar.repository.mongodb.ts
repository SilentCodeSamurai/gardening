import type {
	CultivarRepositoryCreateInputDTO,
	CultivarRepositoryCreateManyInputDTO,
	CultivarRepositoryCreateManyOutputDTO,
	CultivarRepositoryCreateOutputDTO,
	CultivarRepositoryDeleteManyOutputDTO,
	CultivarRepositoryDeleteOutputDTO,
	CultivarRepositoryFilterClause,
	CultivarRepositoryGetFullOutputDTO,
	CultivarRepositoryGetManyOutputDTO,
	CultivarRepositoryGetOneOutputDTO,
	CultivarRepositoryPort,
	CultivarRepositoryUpdateManyOutputDTO,
	CultivarRepositoryUpdateOutputDTO,
	CultivarRepositoryUpdatePatchDTO,
} from "@backend/core/application/ports/repositories/gardening/cultivar.repository.port";
import { TransactionManagerMongoDB } from "@backend/infrastructure/adapters/transaction/transaction-manager.mongodb";
import { MongoDBDatabaseNameToken } from "@backend/infrastructure/integrations/mongodb/injection-tokens";
import { cultivarId } from "@backend/infrastructure/integrations/shared/database-ids";
import { inject, injectable } from "tsyringe";
import { BaseMongoDBRepository } from "../shared/base-mongodb.repository";
import { MONGODB_COLLECTION_TYPE } from "../shared/mongodb.constants";
import { MONGODB_MAPPERS } from "../shared/mongodb.mappers";
import type { CultivarDoc } from "../shared/mongodb.models";

@injectable()
export class CultivarMongoDBRepository extends BaseMongoDBRepository implements CultivarRepositoryPort {
	constructor(
		@inject(TransactionManagerMongoDB) tx: TransactionManagerMongoDB,
		@inject(MongoDBDatabaseNameToken) databaseName: string,
	) {
		super(tx, databaseName);
	}

	async createOne(dto: CultivarRepositoryCreateInputDTO): Promise<CultivarRepositoryCreateOutputDTO> {
		if (dto.speciesId !== null) {
			const species = await this.collection(MONGODB_COLLECTION_TYPE.SPECIES).findOne(
				{ id: dto.speciesId },
				{ session: this.tx.session },
			);
			if (!species) this.throwNotFoundError("Species", [{ id: dto.speciesId }]);
		}
		const now = new Date();
		const doc: CultivarDoc = {
			...dto,
			id: cultivarId(),
			createdAt: now,
			updatedAt: now,
			workspaceKey: dto.workspace.toKey(),
		};
		await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).insertOne(doc, { session: this.tx.session });
		return MONGODB_MAPPERS.cultivar(doc);
	}
	async createMany(input: CultivarRepositoryCreateManyInputDTO): Promise<CultivarRepositoryCreateManyOutputDTO> {
		if (input.items.length === 0) return { count: 0 };
		for (const item of input.items) {
			if (item.speciesId !== null) {
				const species = await this.collection(MONGODB_COLLECTION_TYPE.SPECIES).findOne(
					{ id: item.speciesId },
					{ session: this.tx.session },
				);
				if (!species) this.throwNotFoundError("Species", [{ id: item.speciesId }]);
			}
		}
		const now = new Date();
		const docs: CultivarDoc[] = input.items.map((item) => ({
			...item,
			id: cultivarId(),
			createdAt: now,
			updatedAt: now,
			workspaceKey: item.workspace.toKey(),
		}));
		await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).insertMany(docs, { session: this.tx.session });
		return { count: input.items.length };
	}
	async getOne(input: {
		filters: readonly CultivarRepositoryFilterClause[];
	}): Promise<CultivarRepositoryGetOneOutputDTO> {
		const doc = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).findOne(this.filters(input.filters), {
			session: this.tx.session,
		});
		if (!doc) this.throwNotFoundError("Cultivar", input.filters);
		return MONGODB_MAPPERS.cultivar(doc);
	}
	async getFullOne(input: {
		filters: readonly CultivarRepositoryFilterClause[];
	}): Promise<CultivarRepositoryGetFullOutputDTO> {
		const row = await this.getOne(input);
		if (row.speciesId === null) return { ...row, species: null };
		const speciesDoc = await this.collection(MONGODB_COLLECTION_TYPE.SPECIES).findOne(
			{ id: row.speciesId },
			{ session: this.tx.session },
		);
		if (!speciesDoc) this.throwNotFoundError("Species", [{ id: row.speciesId }]);
		return { ...row, species: MONGODB_MAPPERS.species(speciesDoc) };
	}
	async getMany(input?: {
		filters?: readonly CultivarRepositoryFilterClause[];
	}): Promise<CultivarRepositoryGetManyOutputDTO> {
		if (input?.filters === undefined) {
			const docs = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS)
				.find({}, { session: this.tx.session })
				.toArray();
			return { items: docs.map(MONGODB_MAPPERS.cultivar) };
		}
		if (input.filters.length === 0) return { items: [] };
		const docs = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS)
			.find(this.filters(input.filters), { session: this.tx.session })
			.toArray();
		return { items: docs.map(MONGODB_MAPPERS.cultivar) };
	}
	async updateOne(input: {
		filters: readonly CultivarRepositoryFilterClause[];
		dto: CultivarRepositoryUpdatePatchDTO;
	}): Promise<CultivarRepositoryUpdateOutputDTO> {
		const row = await this.getOne({ filters: input.filters });
		const updated = { ...row, ...input.dto, updatedAt: new Date() };
		if (updated.speciesId !== null) {
			const species = await this.collection(MONGODB_COLLECTION_TYPE.SPECIES).findOne(
				{ id: updated.speciesId },
				{ session: this.tx.session },
			);
			if (!species) this.throwNotFoundError("Species", [{ id: updated.speciesId }]);
		}
		await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).replaceOne(
			{ id: row.id },
			{ ...updated, workspaceKey: updated.workspace.toKey() },
			{ session: this.tx.session },
		);
		return updated;
	}
	async updateMany(input: {
		filters: readonly CultivarRepositoryFilterClause[];
		dto: CultivarRepositoryUpdatePatchDTO;
	}): Promise<CultivarRepositoryUpdateManyOutputDTO> {
		if (input.dto.speciesId !== undefined && input.dto.speciesId !== null) {
			const species = await this.collection(MONGODB_COLLECTION_TYPE.SPECIES).findOne(
				{ id: input.dto.speciesId },
				{ session: this.tx.session },
			);
			if (!species) this.throwNotFoundError("Species", [{ id: input.dto.speciesId }]);
		}
		const dtoDoc = { ...input.dto } as Record<string, unknown>;
		if (input.dto.workspace !== undefined) {
			dtoDoc.workspaceKey = input.dto.workspace.toKey();
			delete dtoDoc.workspace;
		}
		dtoDoc.updatedAt = new Date();
		const result = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).updateMany(
			this.filters(input.filters),
			{ $set: dtoDoc },
			{ session: this.tx.session },
		);
		return { count: result.modifiedCount };
	}
	async deleteOne(input: {
		filters: readonly CultivarRepositoryFilterClause[];
	}): Promise<CultivarRepositoryDeleteOutputDTO> {
		const row = await this.getOne({ filters: input.filters });
		await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).deleteOne(
			{ id: row.id },
			{ session: this.tx.session },
		);
		await this.collection(MONGODB_COLLECTION_TYPE.PLANTS).updateMany(
			{ cultivarId: row.id },
			{ $set: { cultivarId: null, updatedAt: new Date() } },
			{ session: this.tx.session },
		);
		return row.id;
	}
	async deleteMany(input: {
		filters: readonly CultivarRepositoryFilterClause[];
	}): Promise<CultivarRepositoryDeleteManyOutputDTO> {
		const rows = (await this.getMany({ filters: input.filters })).items;
		const ids = rows.map((row) => row.id);
		if (ids.length === 0) return { count: 0 };
		await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).deleteMany(
			{ id: { $in: ids } },
			{ session: this.tx.session },
		);
		await this.collection(MONGODB_COLLECTION_TYPE.PLANTS).updateMany(
			{ cultivarId: { $in: ids } },
			{ $set: { cultivarId: null, updatedAt: new Date() } },
			{ session: this.tx.session },
		);
		return { count: ids.length };
	}
}
