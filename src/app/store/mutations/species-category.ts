import { WorkspaceVO } from "@backend/core/domain/access/workspace.vo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SpeciesCategoryWithSystemCatalog } from "#/backend/core/application/use-cases/gardening/species-category.use-cases";
import { renderError } from "@/lib/render-error";
import { orpc } from "@/orpc/client";
import * as m from "@/paraglide/messages.js";

import { useActiveWorkspaceKey } from "@/store/active-workspace-key";
import {
	appendToItemsContainer,
	removeFromItemsContainer,
	removeManyFromItemsContainer,
	upsertInItemsContainer,
} from "@/store/cache-utils";
import { queryKeys } from "@/store/keys";
import type { CachedSpeciesCategoryList, CachedSpeciesCategoryWithSystemCatalog } from "@/store/query-cache-types";
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

export function useSpeciesCategoryCreateMutation() {
	const queryClient = useQueryClient();
	const workspaceKey = useActiveWorkspaceKey();

	return useMutation(
		orpc.speciesCategory.create.mutationOptions({
			onMutate: async (variables) => {
				await cancelQueriesByKeys(queryClient, [queryKeys.speciesCategory.all.queryKey]);
				const snapshots = snapshotQueries(queryClient, [queryKeys.speciesCategory.all.queryKey]);
				if (!workspaceKey) return { snapshots, pendingId: undefined as string | undefined };
				const pendingId = makePendingId("species-category");
				const pending: CachedSpeciesCategoryWithSystemCatalog = {
					workspace: WorkspaceVO.fromKey(workspaceKey),
					id: pendingId as SpeciesCategoryWithSystemCatalog["id"],
					title: variables.title,
					systemCatalog: false,
					presentation: variables.presentation,
					createdAt: new Date(),
					updatedAt: new Date(),
					objectStatus: QUERY_OBJECT_PENDING,
				};
				queryClient.setQueryData<CachedSpeciesCategoryList>(queryKeys.speciesCategory.all.queryKey, (prev) =>
					appendToItemsContainer(prev, pending),
				);
				queryClient.setQueryData(queryKeys.speciesCategory.detail(pending.id).queryKey, pending);
				return { snapshots, pendingId };
			},
			onError: (error, _vars, ctx) => {
				if (!ctx) return;
				restoreQuerySnapshots(queryClient, ctx.snapshots);
				if (ctx.pendingId) {
					queryClient.setQueryData(
						queryKeys.speciesCategory.detail(ctx.pendingId as SpeciesCategoryWithSystemCatalog["id"])
							.queryKey,
						undefined,
					);
				}
				toast.error(renderError(error, m.collections_speciesCategory_actionError()));
			},
			onSuccess: (entity, _vars, ctx) => {
				if (ctx?.pendingId) {
					queryClient.setQueryData<CachedSpeciesCategoryList>(
						queryKeys.speciesCategory.all.queryKey,
						(prev) =>
							replacePendingInItemsContainer(
								prev,
								ctx.pendingId as SpeciesCategoryWithSystemCatalog["id"],
								entity,
							),
					);
					queryClient.setQueryData(
						queryKeys.speciesCategory.detail(ctx.pendingId as SpeciesCategoryWithSystemCatalog["id"])
							.queryKey,
						undefined,
					);
				} else {
					queryClient.setQueryData<CachedSpeciesCategoryList>(
						queryKeys.speciesCategory.all.queryKey,
						(prev) => replacePendingInItemsContainer(prev, entity.id, entity),
					);
				}
				queryClient.setQueryData(queryKeys.speciesCategory.detail(entity.id).queryKey, entity);
				toast.success(m.collections_speciesCategory_createSuccess());
			},
		}),
	);
}

export function useSpeciesCategoryUpdateMutation() {
	const queryClient = useQueryClient();

	return useMutation(
		orpc.speciesCategory.update.mutationOptions({
			onMutate: async (variables) => {
				await cancelQueriesByKeys(queryClient, [queryKeys.speciesCategory.all.queryKey]);
				const snapshots = snapshotQueries(queryClient, [
					queryKeys.speciesCategory.all.queryKey,
					queryKeys.speciesCategory.detail(variables.id).queryKey,
				]);
				const previousAll = snapshots[0]?.data as CachedSpeciesCategoryList | undefined;
				const previousDetail = snapshots[1]?.data as CachedSpeciesCategoryWithSystemCatalog | undefined;
				const base =
					previousDetail ??
					previousAll?.items.find((item) => String(item.id) === String(variables.id)) ??
					null;
				if (base && !isQueryObjectPending(base)) {
					const optimistic = markQueryObjectPending({
						...base,
						...variables,
						id: base.id,
						updatedAt: new Date(),
					});
					queryClient.setQueryData<CachedSpeciesCategoryList>(
						queryKeys.speciesCategory.all.queryKey,
						(prev) => upsertInItemsContainer(prev, optimistic),
					);
					queryClient.setQueryData(queryKeys.speciesCategory.detail(variables.id).queryKey, optimistic);
				}
				return { snapshots };
			},
			onError: (error, variables, ctx) => {
				if (!ctx) return;
				void variables;
				restoreQuerySnapshots(queryClient, ctx.snapshots);
				toast.error(renderError(error, m.collections_speciesCategory_actionError()));
			},
			onSuccess: (entity) => {
				queryClient.setQueryData<CachedSpeciesCategoryList>(queryKeys.speciesCategory.all.queryKey, (prev) =>
					upsertInItemsContainer(prev, entity),
				);
				queryClient.setQueryData(queryKeys.speciesCategory.detail(entity.id).queryKey, entity);
				toast.success(m.collections_speciesCategory_updateSuccess());
			},
		}),
	);
}

export function useSpeciesCategoryDeleteMutation() {
	const queryClient = useQueryClient();

	return useMutation(
		orpc.speciesCategory.delete.mutationOptions({
			onMutate: async (variables) => {
				await cancelQueriesByKeys(queryClient, [queryKeys.speciesCategory.all.queryKey]);
				const snapshots = snapshotQueries(queryClient, [
					queryKeys.speciesCategory.all.queryKey,
					queryKeys.speciesCategory.detail(variables.id).queryKey,
				]);
				const previousAll = snapshots[0]?.data as CachedSpeciesCategoryList | undefined;
				const row = previousAll?.items.find((item) => String(item.id) === String(variables.id));
				if (isQueryObjectPending(row)) return { snapshots };
				queryClient.setQueryData<CachedSpeciesCategoryList>(queryKeys.speciesCategory.all.queryKey, (prev) =>
					removeFromItemsContainer(prev, variables.id),
				);
				queryClient.setQueryData(queryKeys.speciesCategory.detail(variables.id).queryKey, undefined);
				return { snapshots };
			},
			onError: (error, variables, ctx) => {
				if (!ctx) return;
				void variables;
				restoreQuerySnapshots(queryClient, ctx.snapshots);
				// TODO: Translate backend error details/codes instead of generic messages.
				toast.error(renderError(error, m.collections_speciesCategory_actionError()));
			},
			onSuccess: (deletedId) => {
				queryClient.setQueryData<CachedSpeciesCategoryList>(queryKeys.speciesCategory.all.queryKey, (prev) =>
					dropPendingInItemsContainer(prev, deletedId),
				);
				queryClient.setQueryData(queryKeys.speciesCategory.detail(deletedId).queryKey, undefined);
				toast.success(m.collections_speciesCategory_deleteSuccess());
			},
		}),
	);
}

export function useSpeciesCategoryDeleteManyMutation() {
	const queryClient = useQueryClient();

	return useMutation(
		orpc.speciesCategory.deleteMany.mutationOptions({
			onMutate: async (variables) => {
				await cancelQueriesByKeys(queryClient, [
					queryKeys.speciesCategory.all.queryKey,
					queryKeys.species.all.queryKey,
				]);
				const snapshots = snapshotQueries(queryClient, [
					queryKeys.speciesCategory.all.queryKey,
					...variables.ids.map((id: string) => queryKeys.speciesCategory.detail(id).queryKey),
				]);
				queryClient.setQueryData<CachedSpeciesCategoryList>(
					queryKeys.speciesCategory.all.queryKey,
					(prev) => removeManyFromItemsContainer(prev, variables.ids) ?? { items: [] },
				);
				for (const id of variables.ids) {
					queryClient.setQueryData(queryKeys.speciesCategory.detail(id).queryKey, undefined);
				}
				return { snapshots };
			},
			onError: (error, variables, ctx) => {
				if (!ctx) return;
				void variables;
				restoreQuerySnapshots(queryClient, ctx.snapshots);
				toast.error(renderError(error, m.collections_speciesCategory_actionError()));
			},
			onSuccess: (_result, variables) => {
				queryClient.setQueryData<CachedSpeciesCategoryList>(queryKeys.speciesCategory.all.queryKey, (prev) =>
					dropPendingManyInItemsContainer(prev, variables.ids),
				);
				for (const id of variables.ids) {
					queryClient.setQueryData(queryKeys.speciesCategory.detail(id).queryKey, undefined);
				}
				void queryClient.invalidateQueries({ queryKey: queryKeys.species.all.queryKey });
				toast.success(m.collections_speciesCategory_deleteManySuccess());
			},
		}),
	);
}
