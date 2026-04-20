import { createQueryKeys } from "@lukemorales/query-key-factory";
import { client as api } from "@/orpc/client";
import { withSyncedItemsContainer, withSyncedTree } from "@/store/query-object-status";

export const spatialKeys = createQueryKeys("spatial", {
	allNodes: {
		queryKey: null,
		queryFn: async (context) => withSyncedItemsContainer(await api.spatial.getAllNodes(context)),
	},

	tree: (rootId: string) => ({
		queryKey: [rootId],
		queryFn: async () => withSyncedTree(await api.spatial.getTreeForRootId({ id: rootId })),
	}),
});
