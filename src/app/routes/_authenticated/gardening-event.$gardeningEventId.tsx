import type { GardeningEventEntityId } from "@backend/core/domain/gardening/entities";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { DashboardPageContent } from "#/app/components/layout/dashboard-page-content";
import { DashboardPageHeading } from "#/app/components/layout/dashboard-page-heading";
import { GardeningActionPresentationIcon } from "@/components/gardening/gardening-action-icon";
import { GardeningEventUpdateDialog } from "@/components/gardening/gardening-event/gardening-event-update-dialog";
import { getPlantDisplayTitle } from "@/components/gardening/plant/plant-list-card";
import { DeleteConfirmDialog } from "@/components/gardening/shared/delete-confirm-dialog";
import { ItemNotFound } from "@/components/layout/item-not-found";
import { PageLoading } from "@/components/layout/page-loading";
import { Button } from "@/components/ui/button";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { gardeningActionMessage } from "@/lib/gardening-action-messages";
import * as m from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime";
import { queryKeys } from "@/store/keys";
import { useGardeningEventDeleteMutation } from "@/store/mutations/gardening-event";

export const Route = createFileRoute("/_authenticated/gardening-event/$gardeningEventId")({
	component: GardeningEventDetailPage,
});

function GardeningEventDetailPage() {
	const [editOpen, setEditOpen] = useState(false);
	const { gardeningEventId } = Route.useParams();
	const id = gardeningEventId as GardeningEventEntityId;
	const [deleteOpen, setDeleteOpen] = useState(false);
	const del = useGardeningEventDeleteMutation();
	const listQuery = useQuery({ ...queryKeys.gardeningEvent.all });
	const data = listQuery.data?.items.find((item) => String(item.id) === String(id));

	const bindingsQuery = useQuery({
		...queryKeys.gardeningEvent.bindings(id),
		enabled: !!data,
	});
	const plantsQuery = useQuery({ ...queryKeys.plant.all });
	const locationsQuery = useQuery({ ...queryKeys.location.all });

	const plantIds = bindingsQuery.data?.plantIds ?? [];
	const locationIds = bindingsQuery.data?.locationIds ?? [];
	const plantsById = new Map((plantsQuery.data?.items ?? []).map((plant) => [String(plant.id), plant] as const));
	const locationsById = new Map(
		(locationsQuery.data?.items ?? []).map((location) => [String(location.id), location] as const),
	);

	if (listQuery.isPending) {
		return <PageLoading />;
	}
	if (listQuery.isError || !data) {
		return <ItemNotFound resourceLabel={m.collections_gardeningEvent_title()} />;
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<DashboardPageHeading className="min-w-0 flex-wrap" collection="gardeningEvent">
				<div className="flex min-w-0 flex-wrap items-center gap-3">
					<GardeningActionPresentationIcon action={data.action} />
					<h1 className="font-heading font-medium text-lg capitalize">
						{gardeningActionMessage(data.action.type)}
					</h1>
				</div>
				<div className="auto flex shrink-0 items-center gap-1">
					<ButtonTooltip label={m.common_edit()}>
						<Button
							type="button"
							variant="outline"
							size="icon"
							aria-label={m.common_edit()}
							onClick={() => setEditOpen(true)}
						>
							<PencilIcon />
						</Button>
					</ButtonTooltip>
					<ButtonTooltip label={m.common_delete()}>
						<Button
							type="button"
							variant="destructive"
							size="icon"
							aria-label={m.common_delete()}
							onClick={() => setDeleteOpen(true)}
						>
							<Trash2Icon />
						</Button>
					</ButtonTooltip>
					<GardeningEventUpdateDialog event={data} open={editOpen} onOpenChange={setEditOpen} />
					<DeleteConfirmDialog
						open={deleteOpen}
						onOpenChange={setDeleteOpen}
						title={m.collections_gardeningEvent_delete()}
						description={gardeningActionMessage(data.action.type)}
						isPending={del.isPending}
						onConfirm={async () => {
							setDeleteOpen(false);
							await del.mutateAsync({ id: data.id });
						}}
					/>
				</div>
			</DashboardPageHeading>
			<DashboardPageContent className="flex flex-col gap-6 overflow-y-auto pb-6">
				<div className="space-y-3">
					<h2 className="font-medium text-lg">{m.components_detail_metaHeading()}</h2>
					<section className="rounded-xl border border-border/70 bg-muted/15 p-4 shadow-sm">
					<dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-[minmax(9rem,auto)_1fr]">
						<div className="contents">
							<dt className="text-muted-foreground">{m.fields_title()}</dt>
							<dd className="wrap-break-word min-w-0 capitalize">
								{gardeningActionMessage(data.action.type)}
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.fields_description()}</dt>
							<dd className="wrap-break-word min-w-0 whitespace-pre-wrap">
								{data.action.content.trim() ? (
									data.action.content
								) : (
									<span className="text-muted-foreground italic">{m.components_detail_field_noNoteBody()}</span>
								)}
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.components_detail_field_actionType()}</dt>
							<dd className="wrap-break-word min-w-0 capitalize">
								{gardeningActionMessage(data.action.type)}
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.fields_occurredAt()}</dt>
							<dd className="wrap-break-word min-w-0">
								{data.occurredAt.toLocaleString(getLocale(), {
									dateStyle: "medium",
									timeStyle: "short",
								})}
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.fields_updatedAt()}</dt>
							<dd className="wrap-break-word min-w-0">
								{data.updatedAt.toLocaleString(getLocale(), {
									dateStyle: "medium",
									timeStyle: "short",
								})}
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.collections_plant_titlePlural()}</dt>
							<dd className="wrap-break-word min-w-0">
								{bindingsQuery.isPending ? (
									<span className="text-muted-foreground">{m.common_loading()}</span>
								) : plantIds.length === 0 ? (
									<span className="text-muted-foreground">{m.components_detail_eventBindings_nonePlants()}</span>
								) : (
									<div className="flex flex-wrap gap-2">
										{plantIds.map((plantId) => {
											const plant = plantsById.get(String(plantId));
											const label = plant ? getPlantDisplayTitle(plant) : m.common_unknown();
											return plant ? (
												<Link
													key={String(plantId)}
													to="/plant/$plantId"
													params={{ plantId: String(plantId) }}
													className="inline-flex rounded-md border border-border/60 px-2.5 py-1 text-primary text-xs underline-offset-4 hover:bg-card/70 hover:underline"
												>
													{label}
												</Link>
											) : (
												<span
													key={String(plantId)}
													className="inline-flex rounded-md border border-border/40 px-2.5 py-1 text-muted-foreground text-xs"
												>
													{label}
												</span>
											);
										})}
									</div>
								)}
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.collections_location_titlePlural()}</dt>
							<dd className="wrap-break-word min-w-0">
								{bindingsQuery.isPending ? (
									<span className="text-muted-foreground">{m.common_loading()}</span>
								) : locationIds.length === 0 ? (
									<span className="text-muted-foreground">{m.components_detail_eventBindings_noneLocations()}</span>
								) : (
									<div className="flex flex-wrap gap-2">
										{locationIds.map((locationId) => {
											const location = locationsById.get(String(locationId));
											const label = location?.name ?? m.common_unknown();
											return location ? (
												<Link
													key={String(locationId)}
													to="/location/$locationId"
													params={{ locationId: String(locationId) }}
													className="inline-flex rounded-md border border-border/60 px-2.5 py-1 text-primary text-xs underline-offset-4 hover:bg-card/70 hover:underline"
												>
													{label}
												</Link>
											) : (
												<span
													key={String(locationId)}
													className="inline-flex rounded-md border border-border/40 px-2.5 py-1 text-muted-foreground text-xs"
												>
													{label}
												</span>
											);
										})}
									</div>
								)}
							</dd>
						</div>
					</dl>
					</section>
				</div>
			</DashboardPageContent>
		</div>
	);
}
