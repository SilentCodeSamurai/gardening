export const MONGODB_COLLECTION_TYPE = {
	WORKSPACE_ROLE_ASSIGNMENTS: "workspace_role_assignments",
	SPECIES_CATEGORIES: "species_categories",
	SPECIES: "species",
	CULTIVARS: "cultivars",
	PLANTS: "plants",
	LOCATIONS: "locations",
	GARDENING_EVENTS: "gardening_events",
	SPATIAL_NODES: "spatial_nodes",
} as const;

export type MongoDBCollectionType = (typeof MONGODB_COLLECTION_TYPE)[keyof typeof MONGODB_COLLECTION_TYPE];
