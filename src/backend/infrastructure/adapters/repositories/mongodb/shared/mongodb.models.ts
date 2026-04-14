import type { WorkspaceRoleAssignmentEntity } from "@backend/core/domain/access/entities";
import type {
	CultivarEntity,
	GardeningEventEntity,
	LocationEntity,
	PlantEntity,
	SpeciesCategoryEntity,
	SpeciesEntity,
} from "@backend/core/domain/gardening/entities";
import type { SpatialNodeEntity } from "@backend/core/domain/spatial/entities";
import { MONGODB_COLLECTION_TYPE } from "./mongodb.constants";

export type WorkspaceRoleAssignmentDoc = Omit<WorkspaceRoleAssignmentEntity, "subject" | "workspace"> & {
	subjectKey: string;
	workspaceKey: string;
};

export type SpeciesCategoryDoc = Omit<SpeciesCategoryEntity, "workspace"> & {
	workspaceKey: string;
};

export type SpeciesDoc = Omit<SpeciesEntity, "workspace"> & {
	workspaceKey: string;
};

export type CultivarDoc = Omit<CultivarEntity, "workspace"> & {
	workspaceKey: string;
};

export type PlantDoc = Omit<PlantEntity, "workspace"> & {
	workspaceKey: string;
};

export type LocationDoc = Omit<LocationEntity, "workspace"> & {
	workspaceKey: string;
};

export type GardeningEventDoc = Omit<GardeningEventEntity, "workspace"> & {
	workspaceKey: string;
	plantIds: string[];
	locationIds: string[];
};

export type SpatialNodeDoc = Omit<SpatialNodeEntity, "workspace"> & {
	workspaceKey: string;
};

export type MongoDBCollectionDocMap = {
	[MONGODB_COLLECTION_TYPE.WORKSPACE_ROLE_ASSIGNMENTS]: WorkspaceRoleAssignmentDoc;
	[MONGODB_COLLECTION_TYPE.SPECIES_CATEGORIES]: SpeciesCategoryDoc;
	[MONGODB_COLLECTION_TYPE.SPECIES]: SpeciesDoc;
	[MONGODB_COLLECTION_TYPE.CULTIVARS]: CultivarDoc;
	[MONGODB_COLLECTION_TYPE.PLANTS]: PlantDoc;
	[MONGODB_COLLECTION_TYPE.LOCATIONS]: LocationDoc;
	[MONGODB_COLLECTION_TYPE.GARDENING_EVENTS]: GardeningEventDoc;
	[MONGODB_COLLECTION_TYPE.SPATIAL_NODES]: SpatialNodeDoc;
};
