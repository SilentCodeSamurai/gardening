import "reflect-metadata";

import { randomUUID } from "node:crypto";
import type { DependencyContainer } from "tsyringe";
import { container } from "tsyringe";
import { afterAll, afterEach } from "vitest";

import { registerAdapters } from "@backend/di/register-adapters";
import { registerMongoDBStorage } from "@backend/di/register-mongodb-storage";
import { MongoDBClient } from "@backend/infrastructure/integrations/mongodb/client";

const activeTestDatabases: string[] = [];
let sharedMongoClient: MongoDBClient | undefined;

function ensureMongoUri(): string {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		throw new Error("MONGODB_URI is required for MongoDB contract tests.");
	}
	return uri;
}

afterEach(async () => {
	while (activeTestDatabases.length > 0) {
		const databaseName = activeTestDatabases.pop();
		if (!databaseName || !sharedMongoClient) continue;
		await sharedMongoClient.db(databaseName).dropDatabase();
	}
});

afterAll(async () => {
	if (!sharedMongoClient) return;
	await sharedMongoClient.close();
	sharedMongoClient = undefined;
});

/** Per-test TSyringe child container backed by a unique MongoDB test database. */
export function createMongoDBTestContainer(): DependencyContainer {
	ensureMongoUri();
	const databaseName = `gc_${randomUUID().replaceAll("-", "").slice(0, 20)}`;

	const child = container.createChildContainer();
	process.env.MONGODB_DB = databaseName;
	registerMongoDBStorage(child);
	if (!sharedMongoClient) {
		sharedMongoClient = child.resolve(MongoDBClient);
	}
	child.register(MongoDBClient, { useValue: sharedMongoClient });
	registerAdapters(child);
	activeTestDatabases.push(databaseName);
	return child;
}
