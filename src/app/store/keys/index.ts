import { type inferQueryKeyStore, mergeQueryKeys } from "@lukemorales/query-key-factory";

import { cultivarKeys } from "./cultivar";
import { gardeningEventKeys } from "./gardening-event";
import { locationKeys } from "./location";
import { plantKeys } from "./plant";
import { spatialKeys } from "./spatial";
import { speciesKeys } from "./species";
import { speciesCategoryKeys } from "./species-category";

export const queryKeys = mergeQueryKeys(
	speciesCategoryKeys,
	speciesKeys,
	cultivarKeys,
	plantKeys,
	locationKeys,
	spatialKeys,
	gardeningEventKeys,
);

export type GardeningQueryKeyStore = inferQueryKeyStore<typeof queryKeys>;

export { cultivarKeys } from "./cultivar";
export { gardeningEventKeys } from "./gardening-event";
export { locationKeys } from "./location";
export { plantKeys } from "./plant";
export { spatialKeys } from "./spatial";
export { speciesKeys } from "./species";
export { speciesCategoryKeys } from "./species-category";
