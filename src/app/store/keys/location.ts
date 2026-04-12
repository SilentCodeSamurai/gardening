import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { markQueryObjectSynced, withSyncedItemsContainer } from "@/store/query-object-status";

export const locationKeys = createQueryKeys("location", {
	all: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.location.getAll(context)),
	},

	detail: (id: string) => ({
		queryKey: [id],
		queryFn: async () => markQueryObjectSynced(await api.location.getById({ id })),
	}),
});
