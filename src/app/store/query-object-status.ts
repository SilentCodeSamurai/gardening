
import type { ItemsContainer } from "@backend/shared/types";

/**
 * Client-only cache metadata for TanStack Query optimistic rows.
 * Fetches should set {@link QUERY_OBJECT_SYNCED} via query `queryFn` wrappers; absence still means not pending.
 */
export const QUERY_OBJECT_PENDING = "pending" as const;
export const QUERY_OBJECT_SYNCED = "synced" as const;

export type QueryObjectStatus = typeof QUERY_OBJECT_PENDING | typeof QUERY_OBJECT_SYNCED;

export type WithQueryObjectStatus<T extends object> = T & { objectStatus?: QueryObjectStatus };

export function markQueryObjectSynced<T extends object>(entity: T): WithQueryObjectStatus<T> {
	return { ...entity, objectStatus: QUERY_OBJECT_SYNCED };
}

export function withSyncedItemsContainer<T extends object>(
	container: ItemsContainer<T>,
): ItemsContainer<WithQueryObjectStatus<T>> {
	return { items: container.items.map((item) => markQueryObjectSynced(item)) };
}

export function withSyncedTree<T extends { children: T[] }>(node: T): WithQueryObjectStatus<T> {
	return {
		...node,
		objectStatus: QUERY_OBJECT_SYNCED,
		children: node.children.map(withSyncedTree),
	};
}

/**
 * Works for any cache row (domain entity or {@link WithQueryObjectStatus}).
 * Uses `object` so branded domain types are accepted without widening entity definitions.
 */
export function isQueryObjectPending(value: object | null | undefined): boolean {
	if (value == null) return false;
	return (value as { objectStatus?: QueryObjectStatus }).objectStatus === QUERY_OBJECT_PENDING;
}

export function markQueryObjectPending<T extends object>(entity: T): WithQueryObjectStatus<T> {
	return { ...entity, objectStatus: QUERY_OBJECT_PENDING };
}
