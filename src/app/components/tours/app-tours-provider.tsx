import { useNavigate, useRouterState } from "@tanstack/react-router";
import { InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ACTIONS, type EventData, STATUS, type Step, type TooltipRenderProps, useJoyride } from "react-joyride";
import { getTourCopy } from "@/components/tours/tour-copy";
import { APP_TOUR_IDS, type AppTourId } from "@/components/tours/tour-ids";
import { Button } from "@/components/ui/button";
import {
	resetCultivarsSearch,
	resetGardeningEventsSearch,
	resetLocationsSearch,
	resetPlantsSearch,
	resetSpeciesSearch,
} from "@/lib/table-search-reset";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages.js";

const TOURS_STORAGE_KEY = "gardening:workflow-tours:completed";
const DYNAMIC_TOUR_ANCHOR_ID = "dynamic-anchor";
type TourCompletionState = Record<AppTourId, boolean>;
type MouseButton = 0 | 1 | 2;
type RequiredAction =
	| {
			type: "click" | "doubleclick";
			mouseButton?: MouseButton;
	  }
	| {
			type: "drag";
			mouseButton?: MouseButton;
			minimalDistancePx: number;
	  };

function getRequiredActionCta(requiredAction: RequiredAction): string {
	switch (requiredAction.type) {
		case "click":
			switch (requiredAction.mouseButton ?? 0) {
				case 2:
					return m.tours_requiredAction_click_right();
				case 1:
					return m.tours_requiredAction_click_middle();
				default:
					return m.tours_requiredAction_click_left();
			}
		case "doubleclick":
			switch (requiredAction.mouseButton ?? 0) {
				case 2:
					return m.tours_requiredAction_doubleclick_right();
				case 1:
					return m.tours_requiredAction_doubleclick_middle();
				default:
					return m.tours_requiredAction_doubleclick_left();
			}
		case "drag":
			return m.tours_requiredAction_drag();
		default:
			return "";
	}
}

type TourStepOptions = {
	/** Element/selector Joyride uses to position the tooltip for this step. */
	target: Step["target"];
	/** Optional tooltip placement override for large targets (e.g. full page wrappers). */
	placement?: Step["placement"];
	/** Index into `tour-copy` step text arrays; keeps copy separate from behavior wiring. */
	copyIndex: number;
	/** Optional async hook that prepares UI before step renders (navigation, opening dialogs, etc.). */
	before?: (runtime: TourRuntimeStore) => Promise<void>;
	/** Declares which user action is required to advance (e.g. click, doubleclick, drag). */
	requiredAction?: RequiredAction;
	/**
	 * Optional selector used to validate required action against a concrete element.
	 * Use when `target` is a proxy anchor or when click events can be retargeted by overlays/portals.
	 */
	requiredActionTarget?: Step["target"];
	/**
	 * Optional element/selector for spotlight highlight, independent from tooltip anchor `target`.
	 * Use when tooltip must anchor to a stable proxy but highlight should stay on the real control.
	 */
	spotlightTarget?: Step["target"];
	/**
	 * Optional selector used to keep a stable floating anchor synced to a moving DOM target.
	 * Use for remount-prone/virtualized targets where Joyride can lose direct node references.
	 */
	anchorTargetSelector?: Step["target"];
	/**
	 * Allows interacting with highlighted element while step is active.
	 * Use for form-entry/action steps; leave false/undefined for read-only explanatory steps.
	 */
	allowInteraction?: boolean;
	/** Max time to wait for target to appear before Joyride emits target-not-found behavior. */
	targetWaitTimeout?: number;
	/** Disables Joyride focus trap to avoid conflicts with modal/dialog focus management. */
	disableFocusTrap?: boolean;
};

type AppToursContextValue = {
	startTour: (id: AppTourId) => void;
	completedByTourId: TourCompletionState;
	activeTourId: AppTourId | null;
	setScopedValue: (key: string, value: unknown) => void;
	getScopedValue: <T = unknown>(key: string) => T | undefined;
	clearScopedValue: (key: string) => void;
};																					

const AppToursContext = createContext<AppToursContextValue | null>(null);

type TourScopedStore = Partial<Record<AppTourId, Record<string, unknown>>>;

type TourRuntimeStore = {
	setScopedValue: (key: string, value: unknown) => void;
	getScopedValue: <T = unknown>(key: string) => T | undefined;
	clearScopedValue: (key: string) => void;
};

function readCompletionState(): TourCompletionState {
	if (typeof window === "undefined") {
		return Object.fromEntries(APP_TOUR_IDS.map((id) => [id, false])) as TourCompletionState;
	}
	try {
		const raw = window.localStorage.getItem(TOURS_STORAGE_KEY);
		const parsed = raw ? (JSON.parse(raw) as Partial<TourCompletionState>) : {};
		return Object.fromEntries(APP_TOUR_IDS.map((id) => [id, parsed[id] === true])) as TourCompletionState;
	} catch {
		return Object.fromEntries(APP_TOUR_IDS.map((id) => [id, false])) as TourCompletionState;
	}
}

function writeCompletionState(state: TourCompletionState) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(state));
}

function waitForSelector(selector: string, timeoutMs = 4000): Promise<void> {
	if (typeof document === "undefined") return Promise.resolve();
	const existing = document.querySelector(selector);
	if (existing) return Promise.resolve();
	return new Promise<void>((resolve) => {
		const start = window.performance.now();
		const timer = window.setInterval(() => {
			if (document.querySelector(selector)) {
				window.clearInterval(timer);
				resolve();
				return;
			}
			if (window.performance.now() - start > timeoutMs) {
				window.clearInterval(timer);
				resolve();
			}
		}, 80);
	});
}

function resolveStepTargetElement(target: Step["target"]): Element | null {
	if (typeof target === "string") return document.querySelector(target);
	if (typeof target === "function") return target();
	if (target && typeof target === "object" && "current" in target) return target.current;
	if (target instanceof Element) return target;
	return null;
}

/**
 * Resolves the element that should satisfy a required-action step.
 *
 * Order matters:
 * 1) match by event target ancestry
 * 2) match by element under pointer (handles retargeted events)
 * 3) fallback to bounding-box hit test across matching candidates
 */
function resolveRequiredActionTargetElement(event: MouseEvent, selector: string): Element | null {
	const clickedElement = event.target as Element | null;
	const matchedByEventTarget = clickedElement?.closest(selector) ?? null;
	if (matchedByEventTarget) return matchedByEventTarget;

	const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY);
	const matchedByPoint = elementAtPoint?.closest(selector) ?? null;
	if (matchedByPoint) return matchedByPoint;

	const candidates = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
	return (
		candidates.find((candidate) => {
			const rect = candidate.getBoundingClientRect();
			return (
				event.clientX >= rect.left &&
				event.clientX <= rect.right &&
				event.clientY >= rect.top &&
				event.clientY <= rect.bottom
			);
		}) ?? null
	);
}

function resolveRequiredActionTargetFromTarget(event: MouseEvent, target: Step["target"]): Element | null {
	if (typeof target === "string") {
		return resolveRequiredActionTargetElement(event, target);
	}
	const resolvedTarget = resolveStepTargetElement(target);
	if (!resolvedTarget) return null;
	const targetNode = event.target as Node | null;
	if (targetNode && resolvedTarget.contains(targetNode)) {
		return resolvedTarget;
	}
	const rect = resolvedTarget.getBoundingClientRect();
	const pointerInsideTarget =
		event.clientX >= rect.left &&
		event.clientX <= rect.right &&
		event.clientY >= rect.top &&
		event.clientY <= rect.bottom;
	return pointerInsideTarget ? resolvedTarget : null;
}

function TourTooltip({ backProps, index, primaryProps, skipProps, size, step, tooltipProps }: TooltipRenderProps) {
	const requiredAction = (step.data as { requiredAction?: RequiredAction } | undefined)?.requiredAction;
	const hideNextButton = requiredAction != null;
	const requiredActionCta = requiredAction ? getRequiredActionCta(requiredAction) : null;
	return (
		<div
			{...tooltipProps}
			className={cn(
				"w-80 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			)}
		>
			{step.title ? <h3 className="mb-2 font-medium text-sm">{step.title}</h3> : null}
			<div className="text-muted-foreground text-sm">{step.content}</div>
			{requiredActionCta ? (
				<div className="mt-2 flex items-start gap-2 rounded-md border border-primary/35 bg-primary/10 px-2.5 py-2 text-foreground text-xs">
					<InfoIcon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
					<span>{requiredActionCta}</span>
				</div>
			) : null}
			<div className="mt-3 flex items-center justify-between gap-2">
				<div className="text-muted-foreground text-xs">
					{index + 1} / {size}
				</div>
				<div className="flex items-center gap-2">
					{index > 0 ? (
						<Button type="button" size="sm" variant="outline" {...backProps}>
							{m.tours_button_back()}
						</Button>
					) : null}
					<Button type="button" size="sm" variant="outline" {...skipProps}>
						{m.tours_button_skip()}
					</Button>
					{hideNextButton ? null : (
						<Button type="button" size="sm" {...primaryProps}>
							{index + 1 === size ? m.tours_button_finish() : m.tours_button_next()}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

export function AppToursProvider({ children }: { children: ReactNode }) {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [activeTourId, setActiveTourId] = useState<AppTourId | null>(null);
	const [completedByTourId, setCompletedByTourId] = useState<TourCompletionState>(() => readCompletionState());
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const scopedStoreRef = useRef<TourScopedStore>({});
	const [dynamicAnchorRect, setDynamicAnchorRect] = useState<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);

	const setScopedValueForTour = useCallback((tourId: AppTourId, key: string, value: unknown) => {
		if (!scopedStoreRef.current[tourId]) {
			scopedStoreRef.current[tourId] = {};
		}
		const scopedByTour = scopedStoreRef.current[tourId];
		if (!scopedByTour) return;
		scopedByTour[key] = value;
	}, []);

	const getScopedValueForTour = useCallback(<T,>(tourId: AppTourId, key: string): T | undefined => {
		return scopedStoreRef.current[tourId]?.[key] as T | undefined;
	}, []);

	const clearScopedValueForTour = useCallback((tourId: AppTourId, key: string) => {
		const scopedByTour = scopedStoreRef.current[tourId];
		if (!scopedByTour) return;
		delete scopedByTour[key];
	}, []);

	const resetScopedStoreForTour = useCallback((tourId: AppTourId) => {
		scopedStoreRef.current[tourId] = {};
	}, []);

	const buildSteps = useCallback(
		(tourId: AppTourId): Step[] => {
			const copy = getTourCopy(tourId);
			const runtimeStore: TourRuntimeStore = {
				setScopedValue: (key, value) => setScopedValueForTour(tourId, key, value),
				getScopedValue: (key) => getScopedValueForTour(tourId, key),
				clearScopedValue: (key) => clearScopedValueForTour(tourId, key),
			};
			/**
			 * Shared step factory.
			 * We keep product-copy indexing and Joyride wiring in one place so tours stay declarative.
			 */
			const step = ({
				target,
				placement,
				copyIndex,
				before,
				requiredAction,
				requiredActionTarget,
				spotlightTarget,
				anchorTargetSelector,
				allowInteraction,
				targetWaitTimeout,
				disableFocusTrap,
			}: TourStepOptions): Step => ({
				target,
				title: copy.steps[copyIndex]?.title ?? copy.name,
				content: copy.steps[copyIndex]?.content ?? copy.name,
				placement: placement ?? "auto",
				skipBeacon: true,
				targetWaitTimeout: targetWaitTimeout ?? 4000,
				disableFocusTrap: disableFocusTrap ?? true,
				spotlightTarget,
				blockTargetInteraction: !allowInteraction ? requiredAction == null : false,
				before: before ? () => before(runtimeStore) : undefined,
				data: requiredAction
					? {
							requiredAction,
							requiredActionTarget,
							anchorTargetSelector,
						}
					: anchorTargetSelector
						? { anchorTargetSelector }
						: undefined,
			});
			switch (tourId) {
				case "localization-personalization":
					return [
						step({
							target: "#language-menu-trigger",
							copyIndex: 0,
							before: async () => waitForSelector("#language-menu-trigger"),
						}),
						step({
							target: "#theme-toggle-trigger",
							copyIndex: 2,
							before: async () => waitForSelector("#theme-toggle-trigger"),
						}),
					];
				case "app-overview":
					return [
						step({
							target: "#nav-home",
							copyIndex: 0,
							requiredAction: { type: "click", mouseButton: 0 },
						}),
						step({
							target: "#dashboard-page",
							placement: "center",
							copyIndex: 1,
							before: async () => {
								if (pathname !== "/dashboard") {
									await navigate({ to: "/dashboard" });
								}
								await waitForSelector("#dashboard-page");
							},
						}),
						step({
							target: "#nav-catalog-categories",
							copyIndex: 6,
							requiredAction: { type: "click", mouseButton: 0 },
						}),
						step({
							target: "#species-categories-page",
							placement: "center",
							copyIndex: 7,
							before: async () => {
								if (pathname !== "/catalog/species-categories")
									await navigate({ to: "/catalog/species-categories" });
								await waitForSelector("#species-categories-page");
							},
						}),

						step({
							target: "#nav-catalog-species",
							copyIndex: 11,
							requiredAction: { type: "click", mouseButton: 0 },
						}),
						step({
							target: "#species-page",
							placement: "center",
							copyIndex: 12,
							before: async () => {
								if (pathname !== "/catalog/species")
									await navigate({ to: "/catalog/species", search: resetSpeciesSearch });
								await waitForSelector("#species-page");
							},
						}),
						step({
							target: "#nav-catalog-cultivars",
							copyIndex: 16,
							requiredAction: { type: "click", mouseButton: 0 },
						}),
						step({
							target: "#cultivars-page",
							placement: "center",
							copyIndex: 17,
							before: async () => {
								if (pathname !== "/catalog/cultivars")
									await navigate({ to: "/catalog/cultivars", search: resetCultivarsSearch });
								await waitForSelector("#cultivars-page");
							},
						}),
						step({
							target: "#nav-plants",
							copyIndex: 21,
							requiredAction: { type: "click", mouseButton: 0 },
						}),
						step({
							target: "#plants-page",
							placement: "center",
							copyIndex: 22,
							before: async () => {
								if (pathname !== "/plants") {
									await navigate({
										to: "/plants",
										search: resetPlantsSearch,
									});
								}
								await waitForSelector("#plants-page");
							},
						}),
						step({
							target: "#nav-locations",
							copyIndex: 26,
							requiredAction: { type: "click", mouseButton: 0 },
						}),
						step({
							target: "#locations-page",
							placement: "center",
							copyIndex: 27,
							before: async () => {
								if (pathname !== "/locations") await navigate({ to: "/locations", search: resetLocationsSearch });
								await waitForSelector("#locations-page");
							},
						}),

						step({
							target: "#nav-events",
							copyIndex: 31,
							requiredAction: { type: "click", mouseButton: 0 },
						}),
						step({
							target: "#events-page",
							placement: "center",
							copyIndex: 32,
							before: async () => {
								if (pathname !== "/gardening-events") {
									await navigate({ to: "/gardening-events", search: resetGardeningEventsSearch });
								}
								await waitForSelector("#events-page");
							},
						}),
					];
				case "working-with-data": {
					const CREATED_PLANT_ID_KEY = "createdPlantId";
					const getCreatedPlantId = () => runtimeStore.getScopedValue<string>(CREATED_PLANT_ID_KEY) ?? null;
					const getCreatedPlantIdOrThrow = () => {
						const createdPlantId = getCreatedPlantId();
						if (!createdPlantId) {
							throw new Error("working-with-data tour requires createdPlantId in scoped store.");
						}
						return createdPlantId;
					};
					const waitForCreatedPlantIdOrThrow = async (timeoutMs = 5000) => {
						const existingId = getCreatedPlantId();
						if (existingId) return existingId;
						const start = window.performance.now();
						return new Promise<string>((resolve, reject) => {
							const timer = window.setInterval(() => {
								const createdPlantId = getCreatedPlantId();
								if (createdPlantId) {
									window.clearInterval(timer);
									resolve(createdPlantId);
									return;
								}
								if (window.performance.now() - start > timeoutMs) {
									window.clearInterval(timer);
									reject(new Error("working-with-data tour timed out waiting for createdPlantId."));
								}
							}, 80);
						});
					};
					const createdRowSelector = (
						actionName:
							| "plant-row-actions-trigger"
							| "plant-row-actions-edit"
							| "plant-row-actions-delete",
					) => {
						const createdPlantId = getCreatedPlantId();
						return createdPlantId
							? `[data-action='${actionName}'][data-id='${createdPlantId}']`
							: null;
					};
					const createdPlantRowSelector = () => {
						const createdPlantId = getCreatedPlantId();
						return createdPlantId ? `tr[data-id='${createdPlantId}']` : null;
					};
					const createdRowElement = (
						tourMarker: "plant-row-actions-trigger" | "plant-row-actions-edit" | "plant-row-actions-delete",
					) => {
						const selector = createdRowSelector(tourMarker);
						return selector ? document.querySelector<HTMLElement>(selector) : null;
					};
					const createdPlantRowElement = () => {
						const selector = createdPlantRowSelector();
						return selector ? document.querySelector<HTMLElement>(selector) : null;
					};
					return [
						step({
							target: "#nav-plants",
							copyIndex: 0,
							requiredAction: { type: "click", mouseButton: 0 },
						}),
						step({
							target: "#plants-page",
							placement: "center",
							copyIndex: 1,
							before: async () => {
								if (pathname !== "/plants") {
									await navigate({
										to: "/plants",
										search: resetPlantsSearch,
									});
								}
								await waitForSelector("#plants-page");
							},
						}),
						step({
							target: "#plants-create-trigger",
							copyIndex: 2,
							requiredAction: { type: "click", mouseButton: 0 },
							before: async () => {
								await waitForSelector("#plants-create-trigger");
							},
						}),
						step({
							target: "#plant-create-form-fields",
							copyIndex: 3,
							allowInteraction: true,
							before: async () => {
								await waitForSelector("#plant-create-form-fields");
							},
						}),
						step({
							target: "#submit",
							copyIndex: 4,
							requiredAction: { type: "click", mouseButton: 0 },
							before: async () => {
								await waitForSelector("#submit");
							},
						}),
						step({
							target: `#${DYNAMIC_TOUR_ANCHOR_ID}`,
							copyIndex: 11,
							spotlightTarget: () => createdPlantRowElement(),
							anchorTargetSelector: () => createdPlantRowElement(),
							before: async () => {
								const createdPlantId = await waitForCreatedPlantIdOrThrow();
								await waitForSelector(
									`tr[data-id='${createdPlantId}']`,
								);
							},
						}),
						step({
							target: `#${DYNAMIC_TOUR_ANCHOR_ID}`,
							copyIndex: 5,
							requiredAction: { type: "click", mouseButton: 0 },
							requiredActionTarget: () => createdRowElement("plant-row-actions-trigger"),
							spotlightTarget: () => createdRowElement("plant-row-actions-trigger"),
							anchorTargetSelector: () => createdRowElement("plant-row-actions-trigger"),
							allowInteraction: true,
							before: async () => {
								const createdPlantId = await waitForCreatedPlantIdOrThrow();
								await waitForSelector(
									`[data-action='plant-row-actions-trigger'][data-id='${createdPlantId}']`,
								);
							},
						}),
						step({
							target: () => createdRowElement("plant-row-actions-edit"),
							copyIndex: 6,
							requiredAction: { type: "click", mouseButton: 0 },
							before: async () => {
								const createdPlantId = await waitForCreatedPlantIdOrThrow();
								await waitForSelector(
									`[data-action='plant-row-actions-edit'][data-id='${createdPlantId}']`,
								);
							},
						}),
						step({
							target: "#plant-update-form-fields",
							copyIndex: 7,
							allowInteraction: true,
							before: async () => {
								await waitForSelector("#plant-update-form-fields");
							},
						}),
						step({
							target: "#submit",
							copyIndex: 8,
							requiredAction: { type: "click", mouseButton: 0 },
							before: async () => {
								await waitForSelector("#submit");
							},
						}),
						step({
							target: `#${DYNAMIC_TOUR_ANCHOR_ID}`,
							copyIndex: 12,
							spotlightTarget: () => createdPlantRowElement(),
							anchorTargetSelector: () => createdPlantRowElement(),
							before: async () => {
								const createdPlantId = getCreatedPlantIdOrThrow();
								await waitForSelector(
									`tr[data-id='${createdPlantId}']`,
								);
							},
						}),
						step({
							target: `#${DYNAMIC_TOUR_ANCHOR_ID}`,
							copyIndex: 5,
							requiredAction: { type: "click", mouseButton: 0 },
							requiredActionTarget: () => createdRowElement("plant-row-actions-trigger"),
							spotlightTarget: () => createdRowElement("plant-row-actions-trigger"),
							anchorTargetSelector: () => createdRowElement("plant-row-actions-trigger"),
							allowInteraction: true,
							before: async () => {
								const createdPlantId = getCreatedPlantIdOrThrow();
								await waitForSelector(
									`[data-action='plant-row-actions-trigger'][data-id='${createdPlantId}']`,
								);
							},
						}),
						step({
							target: () => createdRowElement("plant-row-actions-delete"),
							copyIndex: 9,
							requiredAction: { type: "click", mouseButton: 0 },
							before: async () => {
								const createdPlantId = getCreatedPlantIdOrThrow();
								const deleteSelector = `[data-action='plant-row-actions-delete'][data-id='${createdPlantId}']`;
								const triggerSelector = `[data-action='plant-row-actions-trigger'][data-id='${createdPlantId}']`;
								const deleteItem = document.querySelector<HTMLElement>(deleteSelector);
								if (!deleteItem) {
									const trigger = document.querySelector<HTMLElement>(triggerSelector);
									trigger?.click();
								}
								await waitForSelector(deleteSelector);
							},
						}),
						step({
							target: "#submit",
							copyIndex: 10,
							requiredAction: { type: "click", mouseButton: 0 },
							before: async () => {
								await waitForSelector("#submit");
							},
						}),
						step({
							target: "#plants-page",
							placement: "center",
							copyIndex: 13,
							before: async () => {
								await waitForSelector("#plants-page");
							},
						}),
					];
				}
				case "layout-editor-guide": {
					const CREATED_LOCATION_ID_KEY = "createdLocationId";
					const getCreatedLocationId = () => runtimeStore.getScopedValue<string>(CREATED_LOCATION_ID_KEY) ?? null;
					const waitForCreatedLocationIdOrThrow = async (timeoutMs = 5000) => {
						const existingId = getCreatedLocationId();
						if (existingId) return existingId;
						const start = window.performance.now();
						return new Promise<string>((resolve, reject) => {
							const timer = window.setInterval(() => {
								const createdLocationId = getCreatedLocationId();
								if (createdLocationId) {
									window.clearInterval(timer);
									resolve(createdLocationId);
									return;
								}
								if (window.performance.now() - start > timeoutMs) {
									window.clearInterval(timer);
									reject(new Error("layout-editor-guide tour timed out waiting for createdLocationId."));
								}
							}, 80);
						});
					};
					const createdLocationRowSelector = () => {
						const createdLocationId = getCreatedLocationId();
						return createdLocationId
							? `[data-action='location-row-open'][data-id='${createdLocationId}']`
							: null;
					};
					return [
						step({
							target: "#nav-locations",
							copyIndex: 0,
							requiredAction: { type: "click", mouseButton: 0 },
						}),
						step({
							target: "#locations-page",
							placement: "center",
							copyIndex: 1,
							before: async () => {
								if (pathname !== "/locations") await navigate({ to: "/locations", search: resetLocationsSearch });
								await waitForSelector("#locations-page");
							},
						}),
						step({
							target: "#locations-create-trigger",
							copyIndex: 2,
							requiredAction: { type: "click", mouseButton: 0 },
							before: async () => {
								await waitForSelector("#locations-create-trigger");
							},
						}),
						step({
							target: "#location-create-form-fields",
							copyIndex: 3,
							allowInteraction: true,
							before: async () => {
								await waitForSelector("#location-create-form-fields");
							},
						}),
						step({
							target: "#location-create-submit",
							copyIndex: 4,
							requiredAction: { type: "click", mouseButton: 0 },
							before: async () => {
								await waitForSelector("#location-create-submit");
							},
						}),
						step({
							target: `#${DYNAMIC_TOUR_ANCHOR_ID}`,
							copyIndex: 5,
							requiredAction: { type: "click", mouseButton: 0 },
							requiredActionTarget: () => {
								const selector = createdLocationRowSelector();
								return selector ? document.querySelector<HTMLElement>(selector) : null;
							},
							spotlightTarget: () => {
								const selector = createdLocationRowSelector();
								return selector ? document.querySelector<HTMLElement>(selector) : null;
							},
							anchorTargetSelector: () => {
								const selector = createdLocationRowSelector();
								return selector ? document.querySelector<HTMLElement>(selector) : null;
							},
							allowInteraction: true,
							before: async () => {
								const createdLocationId = await waitForCreatedLocationIdOrThrow();
								await waitForSelector(`[data-action='location-row-open'][data-id='${createdLocationId}']`);
							},
						}),
						step({
							target: "#location-details-page",
							placement: "center",
							copyIndex: 6,
							before: async () => {
								await waitForSelector("#location-details-page");
							},
						}),
						step({
							target: "#location-open-layout-editor",
							copyIndex: 7,
							requiredAction: { type: "click", mouseButton: 0 },
							before: async () => {
								await waitForSelector("#location-open-layout-editor");
							},
						}),
						step({
							target: "#layout-editor-root",
							placement: "center",
							copyIndex: 8,
							before: async () => {
								await waitForSelector("#layout-editor-root");
							},
						}),
						step({
							target: "#layout-editor-lock-toggle",
							copyIndex: 9,
							before: async () => {
								await waitForSelector("#layout-editor-lock-toggle");
							},
						}),
						step({
							target: "#layout-editor-grid-toggle",
							copyIndex: 10,
							before: async () => {
								await waitForSelector("#layout-editor-grid-toggle");
							},
						}),
						step({
							target: "#layout-editor-zoom-out",
							copyIndex: 11,
							before: async () => {
								await waitForSelector("#layout-editor-zoom-out");
							},
						}),
						step({
							target: "#layout-editor-history-undo",
							copyIndex: 12,
							before: async () => {
								await waitForSelector("#layout-editor-history-undo");
							},
						}),
						step({
							target: "#layout-editor-viewport",
							copyIndex: 13,
							before: async () => {
								await waitForSelector("#layout-editor-viewport");
							},
							placement: "center",
						}),
					];
				}
				default:
					return [];
			}
		},
		[navigate, pathname, setScopedValueForTour, getScopedValueForTour, clearScopedValueForTour],
	);

	const steps = useMemo(() => (activeTourId ? buildSteps(activeTourId) : []), [activeTourId, buildSteps]);
	const currentStep = steps[currentStepIndex];
	const currentAnchorTargetSelector = (
		currentStep?.data as { anchorTargetSelector?: Step["target"] } | undefined
	)?.anchorTargetSelector;

	useEffect(() => {
		// Keep a stable "virtual" anchor synced to whichever selector a step requests.
		// This prevents tooltip jumps when real targets are remounted (e.g. virtualized tables).
		const resolvedAnchorTarget = currentAnchorTargetSelector
			? resolveStepTargetElement(currentAnchorTargetSelector)
			: null;
		if (!resolvedAnchorTarget) {
			setDynamicAnchorRect(null);
			return;
		}
		const anchorTarget = currentAnchorTargetSelector;
		let raf = 0;
		const update = () => {
			if (!anchorTarget) return;
			const target = resolveStepTargetElement(anchorTarget);
			if (target) {
				const rect = target.getBoundingClientRect();
				setDynamicAnchorRect({
					x: rect.x,
					y: rect.y,
					width: rect.width,
					height: rect.height,
				});
			}
			raf = requestAnimationFrame(update);
		};
		raf = requestAnimationFrame(update);
		return () => cancelAnimationFrame(raf);
	}, [currentAnchorTargetSelector]);

	const { Tour, controls } = useJoyride({
		run: activeTourId !== null,
		steps,
		continuous: true,
		tooltipComponent: TourTooltip,
		floatingOptions: {
			strategy: "fixed",
			shiftOptions: { padding: 8 },
		},
		options: {
			primaryColor: "var(--primary)",
			backgroundColor: "var(--popover)",
			textColor: "var(--popover-foreground)",
			overlayColor: "rgba(0, 0, 0, 0.3)",
			arrowColor: "var(--popover)",
			overlayClickAction: false,
			zIndex: 200,
		},
		styles: {
			overlay: {
				backgroundColor: "rgba(0, 0, 0, 0.7)",
			},
			spotlight: {
				cursor: "default",
				stroke: "var(--primary)",
				strokeWidth: 2,
			},
		},
		onEvent: (data: EventData, controls) => {
			if (!activeTourId) return;
			if (data.type === "tooltip" && typeof data.index === "number") {
				setCurrentStepIndex(data.index);
			}
			if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
				const next = { ...completedByTourId, [activeTourId]: true };
				setCompletedByTourId(next);
				writeCompletionState(next);
				setActiveTourId(null);
				setCurrentStepIndex(0);
				scopedStoreRef.current[activeTourId] = {};
			}
			if (data.type === "error:target_not_found") {
				// Only auto-advance on forward flow.
				// On back flow, a transient miss (route/render race) should not skip an extra step.
				if (data.action !== ACTIONS.PREV && typeof controls.next === "function") {
					controls.next();
				}
			}
		},
	});

	useEffect(() => {
		if (!activeTourId || !currentStep) return;
		const requiredAction = (currentStep.data as { requiredAction?: RequiredAction } | undefined)?.requiredAction;
		const requiredActionTarget = (currentStep.data as { requiredActionTarget?: Step["target"] } | undefined)
			?.requiredActionTarget;
		if (!requiredAction) return;
		if (requiredAction.type === "drag") {
			let startPoint: { x: number; y: number } | null = null;
			let dragMatched = false;
			const minDistance = Math.max(1, requiredAction.minimalDistancePx);
			const isAllowedButton = (event: PointerEvent) =>
				requiredAction.mouseButton == null || event.button === requiredAction.mouseButton;
			const matchTarget = (event: PointerEvent) => {
				if (requiredActionTarget) {
					return resolveRequiredActionTargetFromTarget(event as unknown as MouseEvent, requiredActionTarget);
				}
				return resolveRequiredActionTargetFromTarget(event as unknown as MouseEvent, currentStep.target);
			};
			const onPointerDown = (event: PointerEvent) => {
				if (!isAllowedButton(event)) return;
				if (!matchTarget(event)) return;
				startPoint = { x: event.clientX, y: event.clientY };
				dragMatched = false;
			};
			const onPointerMove = (event: PointerEvent) => {
				if (!startPoint || dragMatched) return;
				const dx = event.clientX - startPoint.x;
				const dy = event.clientY - startPoint.y;
				if (Math.hypot(dx, dy) < minDistance) return;
				if (typeof controls.next === "function") {
					dragMatched = true;
					controls.next();
				}
			};
			const clearPointerState = () => {
				startPoint = null;
				dragMatched = false;
			};
			document.addEventListener("pointerdown", onPointerDown, true);
			document.addEventListener("pointermove", onPointerMove, true);
			document.addEventListener("pointerup", clearPointerState, true);
			document.addEventListener("pointercancel", clearPointerState, true);
			return () => {
				document.removeEventListener("pointerdown", onPointerDown, true);
				document.removeEventListener("pointermove", onPointerMove, true);
				document.removeEventListener("pointerup", clearPointerState, true);
				document.removeEventListener("pointercancel", clearPointerState, true);
			};
		}

		const eventName = requiredAction.type === "doubleclick" ? "dblclick" : "click";
		// Capture phase listener ensures we can validate required actions
		// even when downstream components stop propagation.
		const onDocumentAction = (event: MouseEvent) => {
			const targetNode = event.target as Node | null;
			if (!targetNode) return;
			if (requiredAction.mouseButton != null && event.button !== requiredAction.mouseButton) return;
			if (requiredActionTarget) {
				const matchedElement = resolveRequiredActionTargetFromTarget(event, requiredActionTarget);
				if (!matchedElement) return;
			} else {
				const targetElement = resolveStepTargetElement(currentStep.target);
				if (!targetElement?.contains(targetNode)) return;
			}
			if (typeof controls.next === "function") {
				controls.next();
			}
		};

		document.addEventListener(eventName, onDocumentAction, true);
		return () => {
			document.removeEventListener(eventName, onDocumentAction, true);
		};
	}, [activeTourId, controls, currentStep]);

	const startTour = useCallback((id: AppTourId) => {
		resetScopedStoreForTour(id);
		setActiveTourId(id);
	}, [resetScopedStoreForTour]);
	const setScopedValue = useCallback(
		(key: string, value: unknown) => {
			if (!activeTourId) return;
			setScopedValueForTour(activeTourId, key, value);
		},
		[activeTourId, setScopedValueForTour],
	);
	const getScopedValue = useCallback(
		<T,>(key: string): T | undefined => {
			if (!activeTourId) return undefined;
			return getScopedValueForTour<T>(activeTourId, key);
		},
		[activeTourId, getScopedValueForTour],
	);
	const clearScopedValue = useCallback(
		(key: string) => {
			if (!activeTourId) return;
			clearScopedValueForTour(activeTourId, key);
		},
		[activeTourId, clearScopedValueForTour],
	);
	const value = useMemo(
		() => ({
			startTour,
			completedByTourId,
			activeTourId,
			setScopedValue,
			getScopedValue,
			clearScopedValue,
		}),
		[startTour, completedByTourId, activeTourId, setScopedValue, getScopedValue, clearScopedValue],
	);

	return (
		<AppToursContext.Provider value={value}>
			{children}
			<div
				id={DYNAMIC_TOUR_ANCHOR_ID}
				style={{
					position: "fixed",
					left: dynamicAnchorRect?.x ?? -9999,
					top: dynamicAnchorRect?.y ?? -9999,
					width: dynamicAnchorRect?.width ?? 1,
					height: dynamicAnchorRect?.height ?? 1,
					pointerEvents: "none",
					zIndex: 1,
				}}
			/>
			{Tour}
		</AppToursContext.Provider>
	);
}

export function useAppTours() {
	const context = useContext(AppToursContext);
	if (!context) {
		throw new Error("useAppTours must be used within AppToursProvider");
	}
	return context;
}
