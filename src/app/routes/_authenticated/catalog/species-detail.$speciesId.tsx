import type { SpeciesEntityId } from "@backend/core/domain/gardening/entities";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { DashboardPageContent } from "#/app/components/layout/dashboard-page-content";
import { DashboardPageHeading } from "#/app/components/layout/dashboard-page-heading";
import { DeleteConfirmDialog } from "@/components/gardening/shared/delete-confirm-dialog";
import { SpeciesUpdateDialog } from "@/components/gardening/species/species-update-dialog";
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
import { useSpeciesDeleteMutation } from "@/store/mutations";

export const Route = createFileRoute("/_authenticated/catalog/species-detail/$speciesId")({
	validateSearch: (search: Record<string, unknown>) => ({
		category: typeof search.category === "string" ? search.category : "",
	}),
	component: SpeciesDetailPage,
});

function SpeciesDetailPage() {
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const navigate = useNavigate();
	const del = useSpeciesDeleteMutation();
	const { speciesId } = Route.useParams();
	const { data: speciesData, isPending, isError } = useQuery({ ...queryKeys.species.all });
	const { data: categories } = useQuery({ ...queryKeys.speciesCategory.all });
	const { data: cultivarsData } = useQuery({ ...queryKeys.cultivar.all });
	const species =
		speciesData?.items.find((item) => String(item.id) === String(speciesId as SpeciesEntityId)) ?? null;

	if (isPending) {
		return <PageLoading />;
	}
	if (isError || !species) {
		return <ItemNotFound resourceLabel={m.collections_species_title()} />;
	}

	const category = categories?.items.find((c) => String(c.id) === String(species.categoryId));
	const categoryTitle = category
		? translateCatalogField(category.title, category.systemCatalog)
		: `${m.common_unknown()} ${m.collections_speciesCategory_title().toLowerCase()}`;

	const name = translateCatalogField(species.characteristics.name, species.systemCatalog);
	const desc = translateCatalogField(species.characteristics.description, species.systemCatalog);
	const linkedCultivarsCount =
		cultivarsData?.items.filter((cultivar) => String(cultivar.speciesId ?? "") === String(species.id)).length ?? 0;

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<DashboardPageHeading className="min-w-0 flex-wrap" collection="species">
				<div className="flex min-w-0 flex-wrap items-center gap-3">
					<ItemPresentationIcon presentation={species.presentation} />
					<h1 className="font-heading font-medium text-lg">{name}</h1>
				</div>
				<div className="ml-auto flex shrink-0 items-center gap-1">
					{!species.systemCatalog ? (
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
							<SpeciesUpdateDialog species={species} open={editOpen} onOpenChange={setEditOpen} />
							<DeleteConfirmDialog
								open={deleteOpen}
								onOpenChange={setDeleteOpen}
								title={m.collections_species_delete()}
								description={name ?? ""}
								warningDescription={
									linkedCultivarsCount > 0
										? linkedCultivarsCount === 1
											? m.collections_species_deleteLinkedSingle()
											: m.collections_species_deleteLinkedMany({
													count: String(linkedCultivarsCount),
												})
										: undefined
								}
								isPending={del.isPending}
								onConfirm={async () => {
									setDeleteOpen(false);
									await del.mutateAsync({ id: species.id });
									await navigate({
										to: "/catalog/species",
										search: {
											cf: serializeUrlColumnFilters([{ id: "category", value: String(species.categoryId) }]),
										},
									});
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
							<dd className="wrap-break-word min-w-0">{name}</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.fields_description()}</dt>
							<dd className="wrap-break-word min-w-0 whitespace-pre-wrap">
								{desc ? (
									desc
								) : (
									<span className="text-muted-foreground italic">{m.components_detail_field_noDescription()}</span>
								)}
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.collections_speciesCategory_title()}</dt>
							<dd className="wrap-break-word min-w-0">
								<Link
									to="/catalog/species-category/$speciesCategoryId"
									params={{ speciesCategoryId: String(species.categoryId) }}
									className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
								>
									<ItemPresentationIcon presentation={category?.presentation} />
									{categoryTitle}
								</Link>
							</dd>
						</div>

						<div className="contents">
							<dt className="text-muted-foreground">{m.components_detail_field_defaultCatalogRow()}</dt>
							<dd className="wrap-break-word min-w-0">
								{species.systemCatalog ? m.common_yes() : m.common_no()}
							</dd>
						</div>

						<div className="contents">
							<dt className="text-muted-foreground">{m.fields_createdAt()}</dt>
							<dd className="wrap-break-word min-w-0">
								{species.createdAt.toLocaleString(getLocale(), {
									dateStyle: "medium",
									timeStyle: "short",
								})}
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.fields_updatedAt()}</dt>
							<dd className="wrap-break-word min-w-0">
								{species.updatedAt.toLocaleString(getLocale(), {
									dateStyle: "medium",
									timeStyle: "short",
								})}
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.collections_cultivar_titlePlural()}</dt>
							<dd className="wrap-break-word min-w-0">
								<Link
									to="/catalog/cultivars"
									search={{
										cf: serializeUrlColumnFilters([
											{ id: "category", value: String(species.categoryId) },
											{ id: "species", value: String(species.id) },
										]),
									}}
									className="text-primary underline-offset-4 hover:underline"
								>
									{m.components_detail_link_cultivarsForSpecies()}
								</Link>
							</dd>
						</div>
						<div className="contents">
							<dt className="text-muted-foreground">{m.collections_plant_titlePlural()}</dt>
							<dd className="wrap-break-word min-w-0">
								<Link
									to="/plants"
									search={{
										cf: serializeUrlColumnFilters([
											{ id: "category", value: String(species.categoryId) },
											{ id: "species", value: String(species.id) },
										]),
									}}
									className="text-primary underline-offset-4 hover:underline"
								>
									{m.components_detail_link_plantsForSpecies()}
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
