import { describe, expect, it } from "vitest";
import type { SpatialNodeEntityId } from "@backend/core/domain/spatial/entities";
import {
	SpatialPlacementCycleError,
	SpatialPlacementDomainService,
	SpatialPlacementSelfParentingError,
} from "@backend/core/domain/services/spatial-placement.domain-service";

describe("SpatialPlacementDomainService", () => {
	const svc = new SpatialPlacementDomainService();

	const id = (v: string): SpatialNodeEntityId => v as unknown as SpatialNodeEntityId;

	it("assertNoSelfParenting passes when parentId is null", () => {
		expect(() => svc.assertNoSelfParenting({ nodeId: id("a"), parentId: null })).not.toThrow();
	});

	it("assertNoSelfParenting passes when parentId differs", () => {
		expect(() => svc.assertNoSelfParenting({ nodeId: id("a"), parentId: id("b") })).not.toThrow();
	});

	it("assertNoSelfParenting throws SpatialPlacementSelfParentingError for self-parent", () => {
		expect(() => svc.assertNoSelfParenting({ nodeId: id("a"), parentId: id("a") })).toThrow(
			SpatialPlacementSelfParentingError,
		);
	});

	it("assertNoCycle passes when parentId is null", () => {
		const parentById = new Map<string, SpatialNodeEntityId | null>();
		expect(() => svc.assertNoCycle({ nodeId: id("a"), parentId: null, parentById })).not.toThrow();
	});

	it("assertNoCycle passes for an acyclic parent chain", () => {
		const nodeId = id("a");
		const parentById = new Map<string, SpatialNodeEntityId | null>([
			["b", id("c")],
			["c", null],
		]);
		expect(() => svc.assertNoCycle({ nodeId, parentId: id("b"), parentById })).not.toThrow();
	});

	it("assertNoCycle throws SpatialPlacementCycleError when ancestry reaches nodeId", () => {
		const nodeId = id("a");
		// b -> a (cycle)
		const parentById = new Map<string, SpatialNodeEntityId | null>([
			["b", nodeId],
		]);

		expect(() =>
			svc.assertNoCycle({ nodeId, parentId: id("b"), parentById }),
		).toThrow(SpatialPlacementCycleError);
	});
});

