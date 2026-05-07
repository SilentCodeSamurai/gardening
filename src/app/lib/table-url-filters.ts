import type { ColumnFiltersState } from "@tanstack/react-table";

type UrlColumnFilter = {
	id: string;
	value: string | number | boolean;
};

export function parseUrlColumnFilters(raw: string | undefined): ColumnFiltersState {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		const result: ColumnFiltersState = [];
		for (const item of parsed) {
			if (!item || typeof item !== "object") continue;
			const id = (item as { id?: unknown }).id;
			const value = (item as { value?: unknown }).value;
			if (typeof id !== "string" || id === "") continue;
			if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
				result.push({ id, value });
			}
		}
		return normalizeColumnFilters(result);
	} catch {
		return [];
	}
}

export function serializeUrlColumnFilters(filters: ColumnFiltersState): string | undefined {
	const cleaned: UrlColumnFilter[] = [];
	for (const filter of normalizeColumnFilters(filters)) {
		if (!filter?.id || typeof filter.id !== "string") continue;
		const value = filter.value;
		if (value === "" || value == null) continue;
		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			cleaned.push({ id: filter.id, value });
		}
	}
	if (cleaned.length === 0) return undefined;
	return JSON.stringify(cleaned);
}

export function areColumnFiltersEqual(a: ColumnFiltersState, b: ColumnFiltersState): boolean {
	const leftFilters = normalizeColumnFilters(a);
	const rightFilters = normalizeColumnFilters(b);
	if (leftFilters.length !== rightFilters.length) return false;
	for (let index = 0; index < leftFilters.length; index += 1) {
		const left = leftFilters[index];
		const right = rightFilters[index];
		if (!left || !right) return false;
		if (left.id !== right.id) return false;
		if (left.value !== right.value) return false;
	}
	return true;
}

function normalizeColumnFilters(filters: ColumnFiltersState): ColumnFiltersState {
	return [...filters].sort((a, b) => a.id.localeCompare(b.id));
}
