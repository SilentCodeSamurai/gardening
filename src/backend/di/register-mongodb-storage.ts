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
import { WorkspaceRoleAssignmentMongoDBRepository } from "../infrastructure/adapters/repositories/mongodb/access/workspace-role-assignment.repository.mongodb";
import { CultivarMongoDBRepository } from "../infrastructure/adapters/repositories/mongodb/gardening/cultivar.repository.mongodb";
import { GardeningEventMongoDBRepository } from "../infrastructure/adapters/repositories/mongodb/gardening/gardening-event.repository.mongodb";
import { LocationMongoDBRepository } from "../infrastructure/adapters/repositories/mongodb/gardening/location.repository.mongodb";
import { PlantMongoDBRepository } from "../infrastructure/adapters/repositories/mongodb/gardening/plant.repository.mongodb";
import { SpeciesMongoDBRepository } from "../infrastructure/adapters/repositories/mongodb/gardening/species.repository.mongodb";
import { SpeciesCategoryMongoDBRepository } from "../infrastructure/adapters/repositories/mongodb/gardening/species-category.repository.mongodb";
import { SpatialNodeMongoDBRepository } from "../infrastructure/adapters/repositories/mongodb/spatial/spatial-node.repository.mongodb";
import { TransactionManagerMongoDB } from "../infrastructure/adapters/transaction/transaction-manager.mongodb";
import { MongoDBClient } from "../infrastructure/integrations/mongodb/client";
import { MongoDBDatabaseNameToken, MongoDBUriToken } from "../infrastructure/integrations/mongodb/injection-tokens";

export function registerMongoDBStorage(c: DependencyContainer): void {
	const databaseName = process.env.MONGODB_DB;
	const uri = process.env.MONGODB_URI;
	if (!databaseName) {
		throw new Error("MONGODB_DB is required.");
	}
	if (!uri) {
		throw new Error("MONGODB_URI is required.");
	}

	c.register(MongoDBUriToken, {
		useValue: uri,
	});
	c.register(MongoDBDatabaseNameToken, {
		useValue: databaseName,
	});
	
	c.register(
		MongoDBClient,
		{
			useClass: MongoDBClient,
		},
		{ lifecycle: Lifecycle.Singleton },
	);
	c.register(
		TransactionManagerMongoDB,
		{ useClass: TransactionManagerMongoDB },
		{ lifecycle: Lifecycle.ContainerScoped },
	);
	c.register(
		TransactionManagerPortToken,
		{ useToken: TransactionManagerMongoDB },
		{ lifecycle: Lifecycle.ContainerScoped },
	);

	c.register(CultivarRepositoryPortToken, { useClass: CultivarMongoDBRepository });
	c.register(PlantRepositoryPortToken, { useClass: PlantMongoDBRepository });
	c.register(SpeciesRepositoryPortToken, { useClass: SpeciesMongoDBRepository });
	c.register(SpeciesCategoryRepositoryPortToken, { useClass: SpeciesCategoryMongoDBRepository });
	c.register(LocationRepositoryPortToken, { useClass: LocationMongoDBRepository });
	c.register(GardeningEventRepositoryPortToken, { useClass: GardeningEventMongoDBRepository });
	c.register(SpatialNodeRepositoryPortToken, { useClass: SpatialNodeMongoDBRepository });
	c.register(WorkspaceRoleAssignmentRepositoryPortToken, { useClass: WorkspaceRoleAssignmentMongoDBRepository });
}
