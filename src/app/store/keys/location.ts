import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { withSyncedItemsContainer } from "@/store/query-object-status";

export const locationKeys = createQueryKeys("location", {
	all: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.location.getAll(context)),
	},
});
