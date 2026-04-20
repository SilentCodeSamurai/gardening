import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { withSyncedItemsContainer } from "@/store/query-object-status";

export const cultivarKeys = createQueryKeys("cultivar", {
	all: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.cultivar.getAll(context)),
	},
});
