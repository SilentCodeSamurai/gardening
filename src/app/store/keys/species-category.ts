import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { withSyncedItemsContainer } from "@/store/query-object-status";

export const speciesCategoryKeys = createQueryKeys("speciesCategory", {
	all: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.speciesCategory.getAll(context)),
	},
});
