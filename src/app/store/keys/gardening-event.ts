import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { markQueryObjectSynced, withSyncedItemsContainer } from "@/store/query-object-status";

export const gardeningEventKeys = createQueryKeys("gardeningEvent", {
	all: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.gardeningEvent.getAll(context)),
	},

	detail: (id: string) => ({
		queryKey: [id],
		queryFn: async () => markQueryObjectSynced(await api.gardeningEvent.getById({ id })),
	}),

	forPlant: (plantId: string) => ({
		queryKey: [plantId],
		queryFn: async () => withSyncedItemsContainer(await api.gardeningEvent.getForPlant({ plantId })),
	}),

	forLocation: (locationId: string) => ({
		queryKey: [locationId],
		queryFn: async () => withSyncedItemsContainer(await api.gardeningEvent.getForLocation({ locationId })),
	}),

	bindings: (id: string) => ({
		queryKey: [id],
		queryFn: () => api.gardeningEvent.getBindingsForEvent({ id }),
	}),
});
