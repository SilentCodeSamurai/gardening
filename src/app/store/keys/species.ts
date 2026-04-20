import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { withSyncedItemsContainer } from "@/store/query-object-status";

export const speciesKeys = createQueryKeys("species", {
	all: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.species.getAll(context)),
	},
});
