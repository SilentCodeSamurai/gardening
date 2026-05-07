import { WorkspaceVO } from "@backend/core/domain/access/workspace.vo";
import type { CultivarEntity, CultivarEntityId, SpeciesEntityId } from "@backend/core/domain/gardening/entities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SpeciesWithSystemCatalog } from "#/backend/core/application/use-cases/gardening/species.use-cases";
import { renderError } from "@/lib/render-error";
import { orpc } from "@/orpc/client";
import * as m from "@/paraglide/messages.js";

import { useActiveWorkspaceKey } from "@/store/active-workspace-key";
import { appendToItemsContainer, removeFromItemsContainer, removeManyFromItemsContainer, upsertInItemsContainer } from "@/store/cache-utils";
import { queryKeys } from "@/store/keys";
import type {
	CachedCultivar,
	CachedCultivarList,
	CachedHydratedPlantList,
	CachedSpeciesList,
} from "@/store/query-cache-types";
import { isQueryObjectPending, markQueryObjectPending, QUERY_OBJECT_PENDING } from "@/store/query-object-status";
import {
	cancelQueriesByKeys,
	dropPendingInItemsContainer,
	dropPendingManyInItemsContainer,
	makePendingId,
	replacePendingInItemsContainer,
	restoreQuerySnapshots,
	snapshotQueries,
} from "./optimistic";

export function useCultivarCreateMutation() {
	const queryClient = useQueryClient();
	const workspaceKey = useActiveWorkspaceKey();

	return useMutation(
		orpc.cultivar.create.mutationOptions({
			onMutate: async (variables) => {
				await cancelQueriesByKeys(queryClient, [queryKeys.cultivar.all.queryKey]);
				const snapshots = snapshotQueries(queryClient, [queryKeys.cultivar.all.queryKey]);
				if (!workspaceKey) return { snapshots, pendingId: undefined as string | undefined };
				const pendingId = makePendingId("cultivar") as CultivarEntity["id"];
				const pending: CachedCultivar = {
					workspace: WorkspaceVO.fromKey(workspaceKey),
					id: pendingId,
					speciesId: variables.speciesId as SpeciesEntityId,
					characteristics: variables.characteristics,
					presentation: variables.presentation,
					createdAt: new Date(),
					updatedAt: new Date(),
					objectStatus: QUERY_OBJECT_PENDING,
				};
				queryClient.setQueryData<CachedCultivarList>(queryKeys.cultivar.all.queryKey, (prev) =>
					appendToItemsContainer(prev, pending),
				);
				return { snapshots, pendingId };
			},
			onError: (error, _vars, ctx) => {
				if (!ctx) return;
				restoreQuerySnapshots(queryClient, ctx.snapshots);
				toast.error(renderError(error, m.collections_cultivar_actionError()));
			},
			onSuccess: (entity, _vars, ctx) => {
				if (ctx?.pendingId) {
					queryClient.setQueryData<CachedCultivarList>(queryKeys.cultivar.all.queryKey, (prev) =>
						replacePendingInItemsContainer(prev, ctx.pendingId as CultivarEntityId, entity),
					);
				} else {
					queryClient.setQueryData<CachedCultivarList>(queryKeys.cultivar.all.queryKey, (prev) =>
						replacePendingInItemsContainer(prev, entity.id, entity),
					);
				}
				toast.success(m.collections_cultivar_createSuccess());
			},
		}),
	);
}

export function useCultivarUpdateMutation() {
	const queryClient = useQueryClient();

	return useMutation(
		orpc.cultivar.update.mutationOptions({
			onMutate: async (variables) => {
				await cancelQueriesByKeys(queryClient, [queryKeys.cultivar.all.queryKey]);
				const snapshots = snapshotQueries(queryClient, [queryKeys.cultivar.all.queryKey]);
				const previousAll = snapshots[0]?.data as CachedCultivarList | undefined;
				const base =
					previousAll?.items.find((item) => String(item.id) === String(variables.id)) ?? null;
				if (base && !isQueryObjectPending(base)) {
					const optimistic = markQueryObjectPending({
						...base,
						...variables,
						id: base.id,
						speciesId: (variables.speciesId !== undefined
							? variables.speciesId
							: base.speciesId) as CultivarEntity["speciesId"],
						updatedAt: new Date(),
					});
					queryClient.setQueryData<CachedCultivarList>(queryKeys.cultivar.all.queryKey, (prev) =>
						upsertInItemsContainer(prev, optimistic),
					);
				}
				return { snapshots };
			},
			onError: (error, variables, ctx) => {
				if (!ctx) return;
				void variables;
				restoreQuerySnapshots(queryClient, ctx.snapshots);
				toast.error(renderError(error, m.collections_cultivar_actionError()));
			},
			onSuccess: (entity) => {
				queryClient.setQueryData<CachedCultivarList>(queryKeys.cultivar.all.queryKey, (prev) =>
					upsertInItemsContainer(prev, entity),
				);
				queryClient.setQueryData<CachedHydratedPlantList>(queryKeys.plant.all.queryKey, (prev) => {
					if (!prev) return prev;
					const speciesById = new Map<string, SpeciesWithSystemCatalog>(
						(queryClient.getQueryData<CachedSpeciesList>(queryKeys.species.all.queryKey)?.items ?? []).map(
							(species) => [String(species.id), species] as const,
						),
					);
					return {
						...prev,
						items: prev.items.map((plant) => {
							if (!plant.cultivar || String(plant.cultivar.id) !== String(entity.id)) return plant;
							const nextSpecies =
								entity.speciesId === null
									? null
									: (speciesById.get(String(entity.speciesId)) ?? plant.cultivar.species);
							return {
								...plant,
								cultivar: {
									...entity,
									species: nextSpecies,
								},
							};
						}),
					};
				});
				toast.success(m.collections_cultivar_updateSuccess());
			},
		}),
	);
}

export function useCultivarUpdateManyMutation() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.cultivar.bulkEditByIds.mutationOptions({
		onMutate: async (variables) => {
			await cancelQueriesByKeys(queryClient, [queryKeys.cultivar.all.queryKey]);
			const snapshots = snapshotQueries(queryClient, [queryKeys.cultivar.all.queryKey]);
			queryClient.setQueryData<CachedCultivarList>(queryKeys.cultivar.all.queryKey, (prev) => {
				if (!prev) return prev;
				const ids = new Set(variables.ids.map(String));
				return {
					...prev,
					items: prev.items.map((item) => {
						if (!ids.has(String(item.id)) || isQueryObjectPending(item)) return item;
						const speciesId = (variables.speciesId !== undefined
							? variables.speciesId
							: item.speciesId) as CultivarEntity["speciesId"];
						return markQueryObjectPending({
							...item,
							speciesId,
							...(variables.characteristics !== undefined
								? { characteristics: variables.characteristics }
								: {}),
							...(variables.presentation !== undefined ? { presentation: variables.presentation } : {}),
							updatedAt: new Date(),
						});
					}),
				};
			});
			return { snapshots };
		},
		onError: (error, _variables, ctx) => {
			if (ctx) restoreQuerySnapshots(queryClient, ctx.snapshots);
			toast.error(renderError(error, m.collections_cultivar_actionError()));
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.cultivar.all.queryKey }),
				queryClient.invalidateQueries({ queryKey: queryKeys.plant.all.queryKey }),
			]);
			toast.success(m.collections_cultivar_updateSuccess());
		},
		}),
	);
}

export function useCultivarDeleteMutation() {
	const queryClient = useQueryClient();

	return useMutation(
		orpc.cultivar.delete.mutationOptions({
			onMutate: async (variables) => {
				await cancelQueriesByKeys(queryClient, [queryKeys.cultivar.all.queryKey]);
				const snapshots = snapshotQueries(queryClient, [
					queryKeys.cultivar.all.queryKey,
				]);
				const previousAll = snapshots[0]?.data as CachedCultivarList | undefined;
				const row = previousAll?.items.find((item) => String(item.id) === String(variables.id));
				if (isQueryObjectPending(row)) return { snapshots };
				queryClient.setQueryData<CachedCultivarList>(queryKeys.cultivar.all.queryKey, (prev) =>
					removeFromItemsContainer(prev, variables.id),
				);
				return { snapshots };
			},
			onError: (error, variables, ctx) => {
				if (!ctx) return;
				void variables;
				restoreQuerySnapshots(queryClient, ctx.snapshots);
				toast.error(renderError(error, m.collections_cultivar_actionError()));
			},
			onSuccess: (deletedId) => {
				queryClient.setQueryData<CachedCultivarList>(queryKeys.cultivar.all.queryKey, (prev) =>
					dropPendingInItemsContainer(prev, deletedId),
				);
				toast.success(m.collections_cultivar_deleteSuccess());
			},
		}),
	);
}

export function useCultivarDeleteManyMutation() {
	const queryClient = useQueryClient();

	return useMutation(
		orpc.cultivar.deleteMany.mutationOptions({
			onMutate: async (variables) => {
				await cancelQueriesByKeys(queryClient, [queryKeys.cultivar.all.queryKey]);
				const snapshots = snapshotQueries(queryClient, [
					queryKeys.cultivar.all.queryKey,
				]);
				queryClient.setQueryData<CachedCultivarList>(
					queryKeys.cultivar.all.queryKey,
					(prev) => removeManyFromItemsContainer(prev, variables.ids) ?? { items: [] },
				);
				return { snapshots };
			},
			onError: (error, variables, ctx) => {
				if (!ctx) return;
				void variables;
				restoreQuerySnapshots(queryClient, ctx.snapshots);
				toast.error(renderError(error, m.collections_cultivar_actionError()));
			},
			onSuccess: (_result, variables) => {
				queryClient.setQueryData<CachedCultivarList>(queryKeys.cultivar.all.queryKey, (prev) =>
					dropPendingManyInItemsContainer(prev, variables.ids),
				);
				void queryClient.invalidateQueries({ queryKey: queryKeys.plant.all.queryKey });
				toast.success(m.collections_cultivar_deleteManySuccess());
			},
		}),
	);
}
