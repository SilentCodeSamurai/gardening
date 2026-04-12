import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { markQueryObjectSynced, withSyncedItemsContainer } from "@/store/query-object-status";

export const cultivarKeys = createQueryKeys("cultivar", {
	all: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.cultivar.getAll(context)),
	},

	detail: (id: string) => ({
		queryKey: [id],
		queryFn: async () => markQueryObjectSynced(await api.cultivar.getById({ id })),
	}),

	fullById: (id: string) => ({
		queryKey: [id],
		queryFn: async () => markQueryObjectSynced(await api.cultivar.getFullById({ id })),
	}),
});
