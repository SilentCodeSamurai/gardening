import type {
	PlantRepositoryCreateInputDTO,
	PlantRepositoryCreateManyInputDTO,
	PlantRepositoryCreateManyOutputDTO,
	PlantRepositoryCreateOutputDTO,
	PlantRepositoryDeleteManyOutputDTO,
	PlantRepositoryDeleteOutputDTO,
	PlantRepositoryFilterClause,
	PlantRepositoryGetManyOutputDTO,
	PlantRepositoryGetOneOutputDTO,
	PlantRepositoryPort,
	PlantRepositoryUpdateManyOutputDTO,
	PlantRepositoryUpdateOutputDTO,
	PlantRepositoryUpdatePatchDTO,
} from "@backend/core/application/ports/repositories/gardening/plant.repository.port";
import type { HydratedPlantEntity, PlantEntity, SpeciesEntity } from "@backend/core/domain/gardening/entities";
import { TransactionManagerMongoDB } from "@backend/infrastructure/adapters/transaction/transaction-manager.mongodb";
import { MongoDBDatabaseNameToken } from "@backend/infrastructure/integrations/mongodb/injection-tokens";
import { plantId } from "@backend/infrastructure/integrations/shared/database-ids";
import { inject, injectable } from "tsyringe";
import { BaseMongoDBRepository } from "../shared/base-mongodb.repository";
import { MONGODB_COLLECTION_TYPE } from "../shared/mongodb.constants";
import { MONGODB_MAPPERS } from "../shared/mongodb.mappers";
import type { PlantDoc } from "../shared/mongodb.models";

@injectable()
export class PlantMongoDBRepository extends BaseMongoDBRepository implements PlantRepositoryPort {
	constructor(
		@inject(TransactionManagerMongoDB) tx: TransactionManagerMongoDB,
		@inject(MongoDBDatabaseNameToken) databaseName: string,
	) {
		super(tx, databaseName);
	}

	async createOne(dto: PlantRepositoryCreateInputDTO): Promise<PlantRepositoryCreateOutputDTO> {
		if (dto.cultivarId !== null) {
			const found = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).findOne(
				{ id: dto.cultivarId },
				{ session: this.tx.session },
			);
			if (!found) this.throwNotFoundError("Cultivar", [{ id: dto.cultivarId }]);
		}
		const now = new Date();
		const doc: PlantDoc = {
			...dto,
			id: plantId(),
			createdAt: now,
			updatedAt: now,
			workspaceKey: dto.workspace.toKey(),
		};
		await this.collection(MONGODB_COLLECTION_TYPE.PLANTS).insertOne(doc, { session: this.tx.session });
		const entity: PlantEntity = MONGODB_MAPPERS.plant(doc);
		if (entity.cultivarId === null) return { ...entity, cultivar: null };
		const cultivar = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).findOne(
			{ id: entity.cultivarId },
			{ session: this.tx.session },
		);
		if (!cultivar) this.throwNotFoundError("Cultivar", [{ id: entity.cultivarId }]);
		let species: SpeciesEntity | null = null;
		if (cultivar.speciesId !== null) {
			const s = await this.collection(MONGODB_COLLECTION_TYPE.SPECIES).findOne(
				{ id: cultivar.speciesId },
				{ session: this.tx.session },
			);
			if (!s) this.throwNotFoundError("Species", [{ id: cultivar.speciesId }]);
			species = MONGODB_MAPPERS.species(s);
		}
		return {
			...entity,
			cultivar: { ...MONGODB_MAPPERS.cultivar(cultivar), species },
		};
	}
	async createMany(input: PlantRepositoryCreateManyInputDTO): Promise<PlantRepositoryCreateManyOutputDTO> {
		if (input.items.length === 0) return { items: [] };
		for (const item of input.items) {
			if (item.cultivarId !== null) {
				const found = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).findOne(
					{ id: item.cultivarId },
					{ session: this.tx.session },
				);
				if (!found) this.throwNotFoundError("Cultivar", [{ id: item.cultivarId }]);
			}
		}
		const now = new Date();
		const docs: PlantDoc[] = input.items.map((item) => ({
			...item,
			id: plantId(),
			createdAt: now,
			updatedAt: now,
			workspaceKey: item.workspace.toKey(),
		}));
		await this.collection(MONGODB_COLLECTION_TYPE.PLANTS).insertMany(docs, { session: this.tx.session });
		return this.getMany({ filters: docs.map((doc) => ({ id: doc.id })) });
	}
	async getOne(input: { filters: readonly PlantRepositoryFilterClause[] }): Promise<PlantRepositoryGetOneOutputDTO> {
		const doc = await this.collection(MONGODB_COLLECTION_TYPE.PLANTS).findOne(this.filters(input.filters), {
			session: this.tx.session,
		});
		if (!doc) this.throwNotFoundError("Plant", input.filters);
		const row: PlantEntity = MONGODB_MAPPERS.plant(doc);
		if (row.cultivarId === null) return { ...row, cultivar: null };
		const cultivar = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).findOne(
			{ id: row.cultivarId },
			{ session: this.tx.session },
		);
		if (!cultivar) this.throwNotFoundError("Cultivar", [{ id: row.cultivarId }]);
		let species: SpeciesEntity | null = null;
		if (cultivar.speciesId !== null) {
			const s = await this.collection(MONGODB_COLLECTION_TYPE.SPECIES).findOne(
				{ id: cultivar.speciesId },
				{ session: this.tx.session },
			);
			if (!s) this.throwNotFoundError("Species", [{ id: cultivar.speciesId }]);
			species = MONGODB_MAPPERS.species(s);
		}
		return {
			...row,
			cultivar: { ...MONGODB_MAPPERS.cultivar(cultivar), species },
		};
	}
	async getMany(input?: {
		filters?: readonly PlantRepositoryFilterClause[];
	}): Promise<PlantRepositoryGetManyOutputDTO> {
		let docs: PlantDoc[];
		if (input?.filters === undefined) {
			docs = await this.collection(MONGODB_COLLECTION_TYPE.PLANTS)
				.find({}, { session: this.tx.session })
				.toArray();
		} else {
			if (input.filters.length === 0) return { items: [] };
			docs = await this.collection(MONGODB_COLLECTION_TYPE.PLANTS)
				.find(this.filters(input.filters), { session: this.tx.session })
				.toArray();
		}
		const items: HydratedPlantEntity[] = [];
		for (const doc of docs) {
			const row: PlantEntity = MONGODB_MAPPERS.plant(doc);
			if (row.cultivarId === null) {
				items.push({ ...row, cultivar: null });
				continue;
			}
			const cultivar = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).findOne(
				{ id: row.cultivarId },
				{ session: this.tx.session },
			);
			if (!cultivar) this.throwNotFoundError("Cultivar", [{ id: row.cultivarId }]);
			let species: SpeciesEntity | null = null;
			if (cultivar.speciesId !== null) {
				const s = await this.collection(MONGODB_COLLECTION_TYPE.SPECIES).findOne(
					{ id: cultivar.speciesId },
					{ session: this.tx.session },
				);
				if (!s) this.throwNotFoundError("Species", [{ id: cultivar.speciesId }]);
				species = MONGODB_MAPPERS.species(s);
			}
			items.push({
				...row,
				cultivar: { ...MONGODB_MAPPERS.cultivar(cultivar), species },
			});
		}
		return { items };
	}
	async updateOne(input: {
		filters: readonly PlantRepositoryFilterClause[];
		dto: PlantRepositoryUpdatePatchDTO;
	}): Promise<PlantRepositoryUpdateOutputDTO> {
		const existing = await this.getOne({ filters: input.filters });
		const updated = { ...existing, ...input.dto, updatedAt: new Date() };
		if (updated.cultivarId !== null) {
			const found = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).findOne(
				{ id: updated.cultivarId },
				{ session: this.tx.session },
			);
			if (!found) this.throwNotFoundError("Cultivar", [{ id: updated.cultivarId }]);
		}
		await this.collection(MONGODB_COLLECTION_TYPE.PLANTS).replaceOne(
			{ id: existing.id },
			{ ...updated, workspaceKey: updated.workspace.toKey() },
			{ session: this.tx.session },
		);
		return this.getOne({ filters: [{ id: updated.id }] });
	}
	async updateMany(input: {
		filters: readonly PlantRepositoryFilterClause[];
		dto: PlantRepositoryUpdatePatchDTO;
	}): Promise<PlantRepositoryUpdateManyOutputDTO> {
		if (input.dto.cultivarId !== undefined && input.dto.cultivarId !== null) {
			const found = await this.collection(MONGODB_COLLECTION_TYPE.CULTIVARS).findOne(
				{ id: input.dto.cultivarId },
				{ session: this.tx.session },
			);
			if (!found) this.throwNotFoundError("Cultivar", [{ id: input.dto.cultivarId }]);
		}
		const dtoDoc = { ...input.dto } as Record<string, unknown>;
		if (input.dto.workspace !== undefined) {
			dtoDoc.workspaceKey = input.dto.workspace.toKey();
			delete dtoDoc.workspace;
		}
		dtoDoc.updatedAt = new Date();
		const result = await this.collection(MONGODB_COLLECTION_TYPE.PLANTS).updateMany(
			this.filters(input.filters),
			{ $set: dtoDoc },
			{ session: this.tx.session },
		);
		return { count: result.modifiedCount };
	}
	async deleteOne(input: {
		filters: readonly PlantRepositoryFilterClause[];
	}): Promise<PlantRepositoryDeleteOutputDTO> {
		const row = await this.getOne({ filters: input.filters });
		await this.collection(MONGODB_COLLECTION_TYPE.PLANTS).deleteOne({ id: row.id }, { session: this.tx.session });
		await this.collection(MONGODB_COLLECTION_TYPE.GARDENING_EVENTS).updateMany(
			{},
			{ $pull: { plantIds: row.id } as never },
			{ session: this.tx.session },
		);
		return row.id;
	}
	async deleteMany(input: {
		filters: readonly PlantRepositoryFilterClause[];
	}): Promise<PlantRepositoryDeleteManyOutputDTO> {
		const rows = (await this.getMany({ filters: input.filters })).items;
		const ids = rows.map((row) => row.id);
		if (ids.length === 0) return { count: 0 };
		await this.collection(MONGODB_COLLECTION_TYPE.PLANTS).deleteMany(
			{ id: { $in: ids } },
			{ session: this.tx.session },
		);
		await this.collection(MONGODB_COLLECTION_TYPE.GARDENING_EVENTS).updateMany(
			{},
			{ $pull: { plantIds: { $in: ids } } as never },
			{ session: this.tx.session },
		);
		return { count: ids.length };
	}
}
