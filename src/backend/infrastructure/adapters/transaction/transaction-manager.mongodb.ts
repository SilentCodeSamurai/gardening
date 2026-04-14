import type { TransactionManagerPort } from "@backend/core/application/ports/transaction/transaction-manager.port";
import { MongoDBClient } from "@backend/infrastructure/integrations/mongodb/client";
import type { ClientSession } from "mongodb";
import { inject, injectable } from "tsyringe";

@injectable()
export class TransactionManagerMongoDB implements TransactionManagerPort {
	private _session: ClientSession | null = null;
	constructor(@inject(MongoDBClient) private readonly _client: MongoDBClient) {}

	async begin(): Promise<void> {
		if (this._session === null) {
			this._session = this._client.startSession();
		}
		if (this._session.inTransaction()) {
			throw new Error("Transaction already started");
		}
		this._session.startTransaction();
	}

	async commit(): Promise<void> {
		if (this._session === null) throw new Error("Session not started");
		if (!this._session.inTransaction()) throw new Error("No transaction to commit");
		await this._session.commitTransaction();
	}

	async rollback(): Promise<void> {
		if (this._session === null) throw new Error("Session not started");
		if (!this._session.inTransaction()) throw new Error("No transaction to rollback");
		await this._session.abortTransaction();
	}

	async release(): Promise<void> {
		if (this._session === null) return;
		await this._session.endSession();
		this._session = null;
	}

	get session(): ClientSession {
		if (!this._session) this._session = this._client.startSession();
		return this._session;
	}

	get client(): MongoDBClient {
		return this._client;
	}
}
