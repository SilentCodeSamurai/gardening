import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { markQueryObjectSynced, withSyncedItemsContainer } from "@/store/query-object-status";

export const speciesKeys = createQueryKeys("species", {
	all: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.species.getAll(context)),
	},

	detail: (id: string) => ({
		queryKey: [id],
		queryFn: async () => markQueryObjectSynced(await api.species.getById({ id })),
	}),
});
