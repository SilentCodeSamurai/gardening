import type { DependencyContainer } from "tsyringe";
import { Lifecycle } from "tsyringe";
import { WorkspaceRoleAssignmentRepositoryPortToken } from "../core/application/ports/repositories/access/workspace-role-assignment.repository.port";
import { CultivarRepositoryPortToken } from "../core/application/ports/repositories/gardening/cultivar.repository.port";
import { GardeningEventRepositoryPortToken } from "../core/application/ports/repositories/gardening/gardening-event.repository.port";
import { LocationRepositoryPortToken } from "../core/application/ports/repositories/gardening/location.repository.port";
import { PlantRepositoryPortToken } from "../core/application/ports/repositories/gardening/plant.repository.port";
import { SpeciesRepositoryPortToken } from "../core/application/ports/repositories/gardening/species.repository.port";
import { SpeciesCategoryRepositoryPortToken } from "../core/application/ports/repositories/gardening/species-category.repository.port";
import { SpatialNodeRepositoryPortToken } from "../core/application/ports/repositories/spatial/spatial-node.repository.port";
import { TransactionManagerPortToken } from "../core/application/ports/transaction/transaction-manager.port";
import { WorkspaceRoleAssignmentInMemoryRepository } from "../infrastructure/adapters/repositories/in-memory/access/workspace-role-assignment.repository.in-memory";
import { CultivarInMemoryRepository } from "../infrastructure/adapters/repositories/in-memory/gardening/cultivar.repository.in-memory";
import { GardeningEventInMemoryRepository } from "../infrastructure/adapters/repositories/in-memory/gardening/gardening-event.repository.in-memory";
import { LocationInMemoryRepository } from "../infrastructure/adapters/repositories/in-memory/gardening/location.repository.in-memory";
import { PlantInMemoryRepository } from "../infrastructure/adapters/repositories/in-memory/gardening/plant.repository.in-memory";
import { SpeciesInMemoryRepository } from "../infrastructure/adapters/repositories/in-memory/gardening/species.repository.in-memory";
import { SpeciesCategoryInMemoryRepository } from "../infrastructure/adapters/repositories/in-memory/gardening/species-category.repository.in-memory";
import { SpatialNodeInMemoryRepository } from "../infrastructure/adapters/repositories/in-memory/spatial/spatial-node.repository.in-memory";
import { InMemoryTransactionManagerAdapter } from "../infrastructure/adapters/transaction/in-memory-transaction-manager.adapter";
import {
	InMemoryDatabaseClient,
	InMemoryDatabaseClientToken,
	InMemoryStoreToken,
} from "../infrastructure/integrations/in-memory-database/client";

export function registerInMemoryStorage(c: DependencyContainer): void {
	c.register(
		InMemoryDatabaseClientToken,
		{
			useClass: InMemoryDatabaseClient,
		},
		{ lifecycle: Lifecycle.Singleton },
	);
	c.register(InMemoryStoreToken, {
		useFactory: (cc) => cc.resolve(InMemoryDatabaseClientToken).getStore(),
	});
	c.register(
		InMemoryTransactionManagerAdapter,
		{ useClass: InMemoryTransactionManagerAdapter },
		{ lifecycle: Lifecycle.ContainerScoped },
	);
	c.register(
		TransactionManagerPortToken,
		{ useToken: InMemoryTransactionManagerAdapter },
		{ lifecycle: Lifecycle.ContainerScoped },
	);
	c.register(CultivarRepositoryPortToken, {
		useClass: CultivarInMemoryRepository,
	});
	c.register(PlantRepositoryPortToken, {
		useClass: PlantInMemoryRepository,
	});
	c.register(SpeciesRepositoryPortToken, {
		useClass: SpeciesInMemoryRepository,
	});
	c.register(SpeciesCategoryRepositoryPortToken, {
		useClass: SpeciesCategoryInMemoryRepository,
	});
	c.register(LocationRepositoryPortToken, {
		useClass: LocationInMemoryRepository,
	});
	c.register(GardeningEventRepositoryPortToken, {
		useClass: GardeningEventInMemoryRepository,
	});
	c.register(SpatialNodeRepositoryPortToken, {
		useClass: SpatialNodeInMemoryRepository,
	});
	c.register(WorkspaceRoleAssignmentRepositoryPortToken, {
		useClass: WorkspaceRoleAssignmentInMemoryRepository,
	});
}
