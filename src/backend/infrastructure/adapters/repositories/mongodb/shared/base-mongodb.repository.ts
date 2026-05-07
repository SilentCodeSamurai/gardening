import { BaseRepository } from "@backend/core/application/ports/repositories/shared/base.repository";
import { SubjectVO } from "@backend/core/domain/access/subject.vo";
import { WorkspaceVO } from "@backend/core/domain/access/workspace.vo";
import { TransactionManagerMongoDB } from "@backend/infrastructure/adapters/transaction/transaction-manager.mongodb";
import { MongoDBDatabaseNameToken } from "@backend/infrastructure/integrations/mongodb/injection-tokens";
import type { Collection, Db } from "mongodb";
import { inject } from "tsyringe";
import type { MongoDBCollectionType } from "./mongodb.constants";
import type { MongoDBCollectionDocMap } from "./mongodb.models";

export abstract class BaseMongoDBRepository extends BaseRepository {
	constructor(
		@inject(TransactionManagerMongoDB) protected readonly tx: TransactionManagerMongoDB,
		@inject(MongoDBDatabaseNameToken) protected readonly databaseName: string,
	) {
		super();
	}

	protected get db(): Db {
		return this.tx.client.db(this.databaseName);
	}

	protected collection<TName extends MongoDBCollectionType>(
		collectionName: TName,
	): Collection<MongoDBCollectionDocMap[TName]> {
		return this.db.collection<MongoDBCollectionDocMap[TName]>(collectionName);
	}

	protected filters<TFilterClause extends object>(
		filters: readonly TFilterClause[],
	): { $or: Record<string, unknown>[] } {
		const or = filters.map((clause) => {
			const query: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(clause as Record<string, unknown>)) {
				if (value === undefined) continue;
				if (value instanceof WorkspaceVO) query.workspaceKey = value.toKey();
				else if (value instanceof SubjectVO) query.subjectKey = value.toKey();
				else query[key] = value;
			}
			return query;
		});
		return { $or: or.length > 0 ? or : [{ _id: "__none__" }] };
	}
}
