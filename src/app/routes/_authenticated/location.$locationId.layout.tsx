import type { LocationEntityId } from "@backend/core/domain/gardening/entities";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DashboardPageContent } from "#/app/components/layout/dashboard-page-content";
import { DashboardPageHeading } from "#/app/components/layout/dashboard-page-heading";
import { LocationLayoutEditor } from "@/components/gardening/location/location-layout-editor";
import { ItemNotFound } from "@/components/layout/item-not-found";
import { PageLoading } from "@/components/layout/page-loading";
import * as m from "@/paraglide/messages.js";
import { queryKeys } from "@/store/keys";
import { resolveRootLocationEntityId } from "@/store/spatial-placement";
export const Route = createFileRoute("/_authenticated/location/$locationId/layout")({
	component: LocationLayoutPage,
});

function LocationLayoutPage() {
	const { locationId } = Route.useParams();
	const openedLocationId = locationId as LocationEntityId;

	const { data: spatialData } = useQuery({
		...queryKeys.spatial.allNodes,
		placeholderData: (previous) => previous,
	});

	const layoutRootLocationId = useMemo(() => {
		return (
			resolveRootLocationEntityId(spatialData?.items ?? [], String(openedLocationId)) ?? String(openedLocationId)
		);
	}, [spatialData?.items, openedLocationId]);

	const rootId = layoutRootLocationId as LocationEntityId;
	const rootDiffersFromOpened = String(rootId) !== String(openedLocationId);

	const openedQuery = useQuery({
		...queryKeys.location.detail(openedLocationId),
	});

	const rootQuery = useQuery({
		...queryKeys.location.detail(rootId),
		enabled: rootDiffersFromOpened,
	});

	const editorRootLocation = rootDiffersFromOpened ? rootQuery.data : openedQuery.data;

	const isPending = openedQuery.isPending || (rootDiffersFromOpened && rootQuery.isPending);
	const isError =
		openedQuery.isError || !openedQuery.data || (rootDiffersFromOpened && (rootQuery.isError || !rootQuery.data));

	if (isPending) {
		return <PageLoading />;
	}
	if (isError || !editorRootLocation) {
		return <ItemNotFound resourceLabel={m.collections_location_title()} />;
	}

	return (
		<>
			<DashboardPageHeading collection="location">
				<h1 className="font-semibold text-xl">{editorRootLocation.name}</h1>
			</DashboardPageHeading>
			{/* <Link
					to="/location/$locationId"
					params={{ locationId: String(openedLocationId) }}
					className="text-primary text-sm underline-offset-4 hover:underline"
				>
					{m.components_locationLayoutEditor_backToLocation()}
				</Link> */}
			<DashboardPageContent className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
				<LocationLayoutEditor
					rootLocation={editorRootLocation}
					className="min-w-0"
					highlightLocationEntityId={String(openedLocationId)}
				/>
			</DashboardPageContent>
		</>
	);
}
