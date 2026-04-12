import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { markQueryObjectSynced, withSyncedItemsContainer } from "@/store/query-object-status";

export const speciesCategoryKeys = createQueryKeys("speciesCategory", {
	all: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.speciesCategory.getAll(context)),
	},

	detail: (id: string) => ({
		queryKey: [id],
		queryFn: async () => markQueryObjectSynced(await api.speciesCategory.getById({ id })),
	}),
});
