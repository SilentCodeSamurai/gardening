import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { withSyncedItemsContainer } from "@/store/query-object-status";

export const plantKeys = createQueryKeys("plant", {
	all: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.plant.getAll(context)),
	},
});
