import * as m from "@/paraglide/messages.js";

export type TableSelectionBulkTooltipInput = {
	selectedCount: number;
	hasPlacedInSelection: boolean;
	/** When true, selection includes built-in catalog rows that cannot be bulk-mutated from this workspace. */
	selectionIncludesDefaultCatalog?: boolean;
	defaultCatalogAction?: "delete" | "update";
	/**
	 * When `"pickSingleLocationForEvent"`, more than one selected shows the “pick one location” message
	 * (table create-event from locations). Omit for plant lists or delete-many (multi-select OK).
	 */
	whenMoreThanOne?: "pickSingleLocationForEvent";
	enabledTooltip: string;
};

/**
 * Shared copy for table bulk actions: none selected, optional single-row rule, placed guard, then enabled hint.
 */
export function tableSelectionBulkTooltip(input: TableSelectionBulkTooltipInput): string {
	if (input.selectedCount === 0) return m.common_actionRequiresSelection();
	if (input.hasPlacedInSelection) return m.common_actionDisabledSelectionContainsPlaced();
	if (input.selectionIncludesDefaultCatalog) {
		if (input.defaultCatalogAction === "update") {
			return m.common_bulkUpdateDisabledSelectionIncludesDefaultCatalog();
		}
		return m.common_bulkDeleteDisabledSelectionIncludesDefaultCatalog();
	}
	if (input.whenMoreThanOne === "pickSingleLocationForEvent" && input.selectedCount !== 1) {
		return m.collections_gardeningEvent_createFromTablePickSingleLocation();
	}
	return input.enabledTooltip;
}
