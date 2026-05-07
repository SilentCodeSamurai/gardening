import type { NavigateFn } from "@tanstack/react-router";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { areColumnFiltersEqual, parseUrlColumnFilters, serializeUrlColumnFilters } from "@/lib/table-url-filters";

type UseTableUrlSyncParams = {
	searchQ: string | undefined;
	searchSortBy: string | undefined;
	searchSortDesc: boolean | undefined;
	searchCf: string | undefined;
	initialSorting: SortingState;
	sorting: SortingState;
	setSorting: Dispatch<SetStateAction<SortingState>>;
	globalFilter: string;
	setGlobalFilter: Dispatch<SetStateAction<string>>;
	columnFilters: ColumnFiltersState;
	setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
	navigate: NavigateFn;
	currentSearch: {
		q: string | undefined;
		sortBy: string | undefined;
		sortDesc: boolean | undefined;
		cf: string | undefined;
	};
};

export function useTableUrlSync({
	searchQ,
	searchSortBy,
	searchSortDesc,
	searchCf,
	initialSorting,
	sorting,
	setSorting,
	globalFilter,
	setGlobalFilter,
	columnFilters,
	setColumnFilters,
	navigate,
	currentSearch,
}: UseTableUrlSyncParams) {
	const sortingHead = sorting[0];
	const initialSortingHead = initialSorting[0];

	useEffect(() => {
		const hasExplicitSort = searchSortBy != null || searchSortDesc != null;
		const nextSorting: SortingState = [
			{
				id: searchSortBy ?? initialSortingHead?.id ?? "",
				desc: hasExplicitSort ? Boolean(searchSortDesc) : Boolean(initialSortingHead?.desc),
			},
		];
		setSorting((previous) =>
			previous[0]?.id === nextSorting[0]?.id && previous[0]?.desc === nextSorting[0]?.desc ? previous : nextSorting,
		);
		const nextGlobalFilter = searchQ ?? "";
		setGlobalFilter((previous) => (previous === nextGlobalFilter ? previous : nextGlobalFilter));
		const nextColumnFilters = parseUrlColumnFilters(searchCf);
		setColumnFilters((previous) =>
			areColumnFiltersEqual(previous, nextColumnFilters) ? previous : nextColumnFilters,
		);
	}, [
		initialSortingHead?.desc,
		initialSortingHead?.id,
		searchCf,
		searchQ,
		searchSortBy,
		searchSortDesc,
		setColumnFilters,
		setGlobalFilter,
		setSorting,
	]);

	useEffect(() => {
		const nextSearch = {
			q: globalFilter || undefined,
			sortBy: sortingHead?.id ?? initialSortingHead?.id ?? undefined,
			sortDesc: Boolean(sortingHead?.desc ?? initialSortingHead?.desc),
			cf: serializeUrlColumnFilters(columnFilters),
		};
		if (
			currentSearch.q === nextSearch.q &&
			currentSearch.sortBy === nextSearch.sortBy &&
			currentSearch.sortDesc === nextSearch.sortDesc &&
			currentSearch.cf === nextSearch.cf
		) {
			return;
		}
		void navigate({
			replace: true,
			search: nextSearch as never,
		});
	}, [
		columnFilters,
		currentSearch.cf,
		currentSearch.q,
		currentSearch.sortBy,
		currentSearch.sortDesc,
		globalFilter,
		initialSortingHead?.desc,
		initialSortingHead?.id,
		navigate,
		sortingHead?.desc,
		sortingHead?.id,
	]);
}
