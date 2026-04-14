import "reflect-metadata";

import type { DependencyContainer } from "tsyringe";
import { container } from "tsyringe";

import { registerAdapters } from "@backend/di/register-adapters";
import { registerInMemoryStorage } from "@backend/di/register-in-memory-storage";

/** Per-test TSyringe child container with a fresh in-memory store. */
export function createInMemoryAccessTestContainer(): DependencyContainer {
	const child = container.createChildContainer();
	registerInMemoryStorage(child);
	registerAdapters(child);
	return child;
}
