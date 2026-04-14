import type {
	LocationRepositoryCreateInputDTO,
	LocationRepositoryCreateManyInputDTO,
	LocationRepositoryCreateManyOutputDTO,
	LocationRepositoryCreateOutputDTO,
	LocationRepositoryDeleteManyOutputDTO,
	LocationRepositoryDeleteOutputDTO,
	LocationRepositoryFilterClause,
	LocationRepositoryGetManyOutputDTO,
	LocationRepositoryGetOneOutputDTO,
	LocationRepositoryPort,
	LocationRepositoryUpdateManyOutputDTO,
	LocationRepositoryUpdateOutputDTO,
	LocationRepositoryUpdatePatchDTO,
} from "@backend/core/application/ports/repositories/gardening/location.repository.port";
import { TransactionManagerMongoDB } from "@backend/infrastructure/adapters/transaction/transaction-manager.mongodb";
import { MongoDBDatabaseNameToken } from "@backend/infrastructure/integrations/mongodb/injection-tokens";
import { locationId } from "@backend/infrastructure/integrations/shared/database-ids";
import { inject, injectable } from "tsyringe";
import { BaseMongoDBRepository } from "../shared/base-mongodb.repository";
import { MONGODB_COLLECTION_TYPE } from "../shared/mongodb.constants";
import { MONGODB_MAPPERS } from "../shared/mongodb.mappers";
import type { LocationDoc } from "../shared/mongodb.models";

@injectable()
export class LocationMongoDBRepository extends BaseMongoDBRepository implements LocationRepositoryPort {
	constructor(
		@inject(TransactionManagerMongoDB) tx: TransactionManagerMongoDB,
		@inject(MongoDBDatabaseNameToken) databaseName: string,
	) {
		super(tx, databaseName);
	}

	async createOne(dto: LocationRepositoryCreateInputDTO): Promise<LocationRepositoryCreateOutputDTO> {
		const now = new Date();
		const doc: LocationDoc = {
			...dto,
			id: locationId(),
			createdAt: now,
			updatedAt: now,
			workspaceKey: dto.workspace.toKey(),
		};
		await this.collection(MONGODB_COLLECTION_TYPE.LOCATIONS).insertOne(doc, { session: this.tx.session });
		return MONGODB_MAPPERS.location(doc);
	}

	async createMany(input: LocationRepositoryCreateManyInputDTO): Promise<LocationRepositoryCreateManyOutputDTO> {
		if (input.items.length === 0) return { count: 0 };
		const now = new Date();
		const docs: LocationDoc[] = input.items.map((item) => ({
			...item,
			id: locationId(),
			createdAt: now,
			updatedAt: now,
			workspaceKey: item.workspace.toKey(),
		}));
		await this.collection(MONGODB_COLLECTION_TYPE.LOCATIONS).insertMany(docs, { session: this.tx.session });
		return { count: input.items.length };
	}

	async getOne(input: {
		filters: readonly LocationRepositoryFilterClause[];
	}): Promise<LocationRepositoryGetOneOutputDTO> {
		const doc = await this.collection(MONGODB_COLLECTION_TYPE.LOCATIONS).findOne(this.filters(input.filters), {
			session: this.tx.session,
		});
		if (!doc) this.throwNotFoundError("Location", input.filters);
		return MONGODB_MAPPERS.location(doc);
	}

	async getMany(input?: {
		filters?: readonly LocationRepositoryFilterClause[];
	}): Promise<LocationRepositoryGetManyOutputDTO> {
		if (input?.filters === undefined) {
			const docs = await this.collection(MONGODB_COLLECTION_TYPE.LOCATIONS)
				.find({}, { session: this.tx.session })
				.toArray();
			return { items: docs.map(MONGODB_MAPPERS.location) };
		}
		if (input.filters.length === 0) return { items: [] };
		const docs = await this.collection(MONGODB_COLLECTION_TYPE.LOCATIONS)
			.find(this.filters(input.filters), { session: this.tx.session })
			.toArray();
		return { items: docs.map(MONGODB_MAPPERS.location) };
	}

	async updateOne(input: {
		filters: readonly LocationRepositoryFilterClause[];
		dto: LocationRepositoryUpdatePatchDTO;
	}): Promise<LocationRepositoryUpdateOutputDTO> {
		const row = await this.getOne({ filters: input.filters });
		const updated = { ...row, ...input.dto, updatedAt: new Date() };
		await this.collection(MONGODB_COLLECTION_TYPE.LOCATIONS).replaceOne(
			{ id: row.id },
			{ ...updated, workspaceKey: updated.workspace.toKey() },
			{ session: this.tx.session },
		);
		return updated;
	}

	async updateMany(input: {
		filters: readonly LocationRepositoryFilterClause[];
		dto: LocationRepositoryUpdatePatchDTO;
	}): Promise<LocationRepositoryUpdateManyOutputDTO> {
		const dtoDoc = { ...input.dto } as Record<string, unknown>;
		if (input.dto.workspace !== undefined) {
			dtoDoc.workspaceKey = input.dto.workspace.toKey();
			delete dtoDoc.workspace;
		}
		dtoDoc.updatedAt = new Date();
		const result = await this.collection(MONGODB_COLLECTION_TYPE.LOCATIONS).updateMany(
			this.filters(input.filters),
			{ $set: dtoDoc },
			{ session: this.tx.session },
		);
		return { count: result.modifiedCount };
	}

	async deleteOne(input: {
		filters: readonly LocationRepositoryFilterClause[];
	}): Promise<LocationRepositoryDeleteOutputDTO> {
		const row = await this.getOne({ filters: input.filters });
		await this.collection(MONGODB_COLLECTION_TYPE.LOCATIONS).deleteOne(
			{ id: row.id },
			{ session: this.tx.session },
		);
		await this.collection(MONGODB_COLLECTION_TYPE.GARDENING_EVENTS).updateMany(
			{},
			{ $pull: { locationIds: row.id } as never },
			{ session: this.tx.session },
		);
		return row.id;
	}

	async deleteMany(input: {
		filters: readonly LocationRepositoryFilterClause[];
	}): Promise<LocationRepositoryDeleteManyOutputDTO> {
		const rows = (await this.getMany({ filters: input.filters })).items;
		const ids = rows.map((row) => row.id);
		if (ids.length === 0) return { count: 0 };
		await this.collection(MONGODB_COLLECTION_TYPE.LOCATIONS).deleteMany(
			{ id: { $in: ids } },
			{ session: this.tx.session },
		);
		await this.collection(MONGODB_COLLECTION_TYPE.GARDENING_EVENTS).updateMany(
			{},
			{ $pull: { locationIds: { $in: ids } } as never },
			{ session: this.tx.session },
		);
		return { count: ids.length };
	}
}
