import "reflect-metadata";

import { container } from "tsyringe";

import type { IUseCase } from "../core/application/use-cases/shared/use-case.interface";

import { registerAdapters } from "./register-adapters";
import { registerApplicationServices } from "./register-application-services";
// import { registerInMemoryStorage } from "./register-in-memory-storage";
import { registerMongoDBStorage } from "./register-mongodb-storage";
import { registerUseCases } from "./register-use-cases";

// registerInMemoryStorage(container);
registerMongoDBStorage(container);
registerAdapters(container);
registerApplicationServices(container);
registerUseCases(container);

export { container as appContainer };

// Ensure the module doesn't get tree-shaken when bundling.
// (We want side-effects: container registrations.)
const _useCaseKeepAlive: (new (...args: unknown[]) => IUseCase<object, object>)[] = [];
void _useCaseKeepAlive;
