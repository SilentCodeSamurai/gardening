import type {
	CultivarEntity,
	GardeningEventEntity,
	HydratedPlantEntity,
	LocationEntity,
} from "@backend/core/domain/gardening/entities";
import type { SpatialNodeEntity } from "@backend/core/domain/spatial/entities";
import type { ItemsContainer } from "@backend/shared/types";
import type { PlantHydratedWithCatalogSpecies } from "#/backend/core/application/use-cases/gardening/plant.use-cases";
import type { SpeciesWithSystemCatalog } from "#/backend/core/application/use-cases/gardening/species.use-cases";
import type { SpeciesCategoryWithSystemCatalog } from "#/backend/core/application/use-cases/gardening/species-category.use-cases";

import type { WithQueryObjectStatus } from "./query-object-status";

/**
 * TanStack Query cache shapes: server DTO plus optional {@link import("./query-object-status").QUERY_OBJECT_PENDING}.
 * Use these for list/detail data that flows through optimistic updates.
 */
export type CachedCultivar = WithQueryObjectStatus<CultivarEntity>;
export type CachedGardeningEvent = WithQueryObjectStatus<GardeningEventEntity>;
export type CachedHydratedPlant = WithQueryObjectStatus<HydratedPlantEntity>;
export type CachedLocation = WithQueryObjectStatus<LocationEntity>;
export type CachedPlantHydratedWithCatalogSpecies = WithQueryObjectStatus<PlantHydratedWithCatalogSpecies>;
export type CachedSpatialNode = WithQueryObjectStatus<SpatialNodeEntity>;
export type CachedSpeciesCategoryWithSystemCatalog = WithQueryObjectStatus<SpeciesCategoryWithSystemCatalog>;
export type CachedSpeciesWithSystemCatalog = WithQueryObjectStatus<SpeciesWithSystemCatalog>;

export type CachedCultivarList = ItemsContainer<CachedCultivar>;
export type CachedGardeningEventList = ItemsContainer<CachedGardeningEvent>;
export type CachedHydratedPlantList = ItemsContainer<CachedHydratedPlant>;
export type CachedLocationList = ItemsContainer<CachedLocation>;
export type CachedSpatialNodeList = ItemsContainer<CachedSpatialNode>;
export type CachedSpeciesCategoryList = ItemsContainer<CachedSpeciesCategoryWithSystemCatalog>;
export type CachedPlantHydratedWithCatalogSpeciesList = ItemsContainer<CachedPlantHydratedWithCatalogSpecies>;
export type CachedSpeciesList = ItemsContainer<CachedSpeciesWithSystemCatalog>;
