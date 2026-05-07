import type { SpeciesCategoryEntityId } from "@backend/core/domain/gardening/entities";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { DashboardPageContent } from "#/app/components/layout/dashboard-page-content";
import { DashboardPageHeading } from "#/app/components/layout/dashboard-page-heading";
import { DeleteConfirmDialog } from "@/components/gardening/shared/delete-confirm-dialog";
import { SpeciesCategoryUpdateDialog } from "@/components/gardening/species-category/species-category-update-dialog";
import { ItemPresentationIcon } from "@/components/icon/item-presentation-icon";
import { ItemNotFound } from "@/components/layout/item-not-found";
import { PageLoading } from "@/components/layout/page-loading";
import { Button } from "@/components/ui/button";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { serializeUrlColumnFilters } from "@/lib/table-url-filters";
import { translateCatalogField } from "@/lib/translate-catalog-field";
import * as m from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime";
import { queryKeys } from "@/store/keys";
import { useSpeciesCategoryDeleteMutation } from "@/store/mutations";

export const Route = createFileRoute("/_authenticated/catalog/species-category/$speciesCategoryId")({
	component: SpeciesCategoryDetailPage,
});

function SpeciesCategoryDetailPage() {
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const navigate = useNavigate();
	const del = useSpeciesCategoryDeleteMutation();
	const { speciesCategoryId } = Route.useParams();
	const { data: categoriesData, isPending, isError } = useQuery({ ...queryKeys.speciesCategory.all });
	const { data: speciesData } = useQuery({ ...queryKeys.species.all });
	const data =
		categoriesData?.items.find(
			(item) => String(item.id) === String(speciesCategoryId as SpeciesCategoryEntityId),
		) ?? null;

	if (isPending) {
		return <PageLoading />;
	}
	if (isError || !data) {
		return <ItemNotFound resourceLabel={m.collections_speciesCategory_title()} />;
	}

	const title = translateCatalogField(data.title, data.systemCatalog);
	const linkedSpeciesCount =
		speciesData?.items.filter((species) => String(species.categoryId ?? "") === String(data.id)).length ?? 0;

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<DashboardPageHeading className="min-w-0 flex-wrap" collection="speciesCategory">
				<div className="flex min-w-0 flex-wrap items-center gap-3">
					<ItemPresentationIcon presentation={data.presentation} />
					<h1 className="font-heading font-medium text-lg">{title}</h1>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					{!data.systemCatalog ? (
						<>
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
							<SpeciesCategoryUpdateDialog category={data} open={editOpen} onOpenChange={setEditOpen} />
							<DeleteConfirmDialog
								open={deleteOpen}
								onOpenChange={setDeleteOpen}
								title={m.collections_speciesCategory_delete()}
								description={title ?? ""}
								warningDescription={
									linkedSpeciesCount > 0
										? linkedSpeciesCount === 1
											? m.collections_speciesCategory_deleteLinkedSingle()
											: m.collections_speciesCategory_deleteLinkedMany({
													count: String(linkedSpeciesCount),
												})
										: undefined
								}
								isPending={del.isPending}
								onConfirm={async () => {
									setDeleteOpen(false);
									await del.mutateAsync({ id: data.id });
									await navigate({ to: "/catalog/species-categories" });
								}}
							/>
						</>
					) : null}
				</div>
			</DashboardPageHeading>
			<DashboardPageContent className="flex flex-col gap-6 overflow-y-auto pb-6">
				<div className="space-y-3">
					<h2 className="font-medium text-lg">{m.components_detail_metaHeading()}</h2>
					<section className="rounded-xl border border-border/70 bg-muted/15 p-4 shadow-sm">
					<dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-[minmax(9rem,auto)_1fr]">
						<div className="contents">
							<dt className="text-muted-foreground">{m.fields_title()}</dt>
							<dd className="wrap-break-word min-w-0">{title}</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.components_detail_field_defaultCatalogRow()}</dt>
							<dd className="wrap-break-word min-w-0">
								{data.systemCatalog ? m.common_yes() : m.common_no()}
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.fields_createdAt()}</dt>
							<dd className="wrap-break-word min-w-0">
								{data.createdAt.toLocaleString(getLocale(), {
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
							<dt className="text-muted-foreground">{m.collections_species_titlePlural()}</dt>
							<dd className="min-w-0">
								<Link
									to="/catalog/species"
									search={{ cf: serializeUrlColumnFilters([{ id: "category", value: String(data.id) }]) }}
									className="text-primary underline-offset-4 hover:underline"
								>
									{m.components_detail_link_speciesInCategory()}
								</Link>
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.collections_cultivar_titlePlural()}</dt>
							<dd className="min-w-0">
								<Link
									to="/catalog/cultivars"
									search={{ cf: serializeUrlColumnFilters([{ id: "category", value: String(data.id) }]) }}
									className="text-primary underline-offset-4 hover:underline"
								>
									{m.components_detail_link_cultivarsInCategory()}
								</Link>
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.collections_plant_titlePlural()}</dt>
							<dd className="min-w-0">
								<Link
									to="/plants"
									search={{ cf: serializeUrlColumnFilters([{ id: "category", value: String(data.id) }]) }}
									className="text-primary underline-offset-4 hover:underline"
								>
									{m.components_detail_link_plantsInCategory()}
								</Link>
							</dd>
						</div>
					</dl>
					</section>
				</div>
			</DashboardPageContent>
		</div>
	);
}
