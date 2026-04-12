import { SignedIn, SignedOut, UserButton } from "@daveyplate/better-auth-ui";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { PublicShellControls } from "@/components/layout/public-shell-controls";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/get-auth-session";
import { consumeIntentToOpenPublicHome } from "@/lib/public-home-navigation";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages.js";

export const Route = createFileRoute("/")({
	beforeLoad: async ({ cause, preload }) => {
		if (preload || cause === "preload") return;

		const session = await getAuthSession();
		if (!session) return;

		// In-app link (e.g. sidebar logo) sets a one-shot flag so authed users can open the landing page.
		if (consumeIntentToOpenPublicHome()) return;

		throw redirect({ to: "/dashboard" });
	},
	component: PublicHomePage,
});

function LandingPreviewLink({
	cardClass,
	authedTo,
	authedSearch,
	children,
}: {
	cardClass: string;
	authedTo: string;
	authedSearch?: Record<string, string>;
	children: ReactNode;
}) {
	return (
		<li>
			<SignedIn>
				<Link to={authedTo} search={authedSearch} className={cardClass}>
					{children}
				</Link>
			</SignedIn>
			<SignedOut>
				<Link to="/auth/$authView" params={{ authView: "sign-in" }} className={cardClass}>
					{children}
				</Link>
			</SignedOut>
		</li>
	);
}

function PublicHomePage() {
	const previewCardClass =
		"group block rounded-xl border border-border/70 bg-card/50 px-4 py-3 text-sm shadow-sm backdrop-blur-sm transition-colors hover:border-primary/35 hover:bg-accent/25";

	const featureCardClass =
		"rounded-xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-4 shadow-sm backdrop-blur-sm";

	return (
		<div className="relative min-h-svh bg-background text-foreground">
			{/* Theme-token gradient wash + orbs (no arbitrary hex) */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
				<div className="absolute inset-0 bg-linear-to-br from-primary/15 via-background to-chart-3/10" />
				<div className="absolute -top-28 -right-20 size-[22rem] rounded-full bg-primary/20 blur-3xl" />
				<div className="absolute top-[28%] -left-36 size-[30rem] rounded-full bg-chart-2/25 blur-3xl" />
				<div className="absolute bottom-[-10%] left-[20%] size-[24rem] rounded-full bg-chart-1/20 blur-3xl" />
				<div className="absolute right-[12%] bottom-24 size-72 rounded-full bg-accent/35 blur-3xl" />
			</div>

			<header className="relative border-border/60 border-b bg-background/70 backdrop-blur-md">
				<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
					<div className="min-w-0">
						<p className="font-heading font-semibold text-foreground text-lg tracking-tight md:text-xl">
							{m.components_hub_title()}
						</p>
						<p className="max-w-md text-muted-foreground text-sm">{m.landing_eyebrow()}</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<PublicShellControls />
						<SignedOut>
							<Button
								variant="outline"
								className="border-border/80 bg-background/60 backdrop-blur-sm"
								asChild
							>
								<Link to="/auth/$authView" params={{ authView: "sign-in" }}>
									{m.landing_signIn()}
								</Link>
							</Button>
							<Button
								className="bg-primary text-primary-foreground shadow-md shadow-primary/15"
								asChild
							>
								<Link to="/auth/$authView" params={{ authView: "sign-up" }}>
									{m.landing_signUp()}
								</Link>
							</Button>
						</SignedOut>
						<SignedIn>
							<Button
								variant="outline"
								className="border-border/80 bg-background/60 backdrop-blur-sm"
								asChild
							>
								<Link to="/dashboard">{m.components_layout_nav_home()}</Link>
							</Button>
							{/* Same surface tokens as the app sidebar so label/email contrast matches the dashboard. */}
							<UserButton size="icon" />
						</SignedIn>
					</div>
				</div>
			</header>

			<main className="relative mx-auto max-w-5xl flex-1 px-4 pt-10 pb-16 md:px-8 md:pt-14 md:pb-24">
				<section className="mb-16 text-center md:mb-20">
					<div className="mx-auto mb-6 inline-flex rounded-full border border-primary/25 bg-gradient-to-r from-primary/10 via-accent/20 to-chart-2/15 px-4 py-1.5 font-medium text-foreground text-xs shadow-sm backdrop-blur-sm">
						{m.landing_heroTagline()}
					</div>
					<h1 className="mb-6 bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text font-heading font-semibold text-4xl text-transparent tracking-tight md:text-5xl">
						{m.components_hub_title()}
					</h1>
					<p className="mx-auto max-w-2xl text-balance text-base text-muted-foreground leading-relaxed md:text-lg">
						{m.landing_description()}
					</p>
				</section>

				<section className="mb-14 md:mb-16">
					<h2 className="mb-6 font-heading font-medium text-foreground text-lg md:text-xl">
						{m.landing_sectionFeatures()}
					</h2>
					<ul className="grid gap-4 sm:grid-cols-2">
						<li className={featureCardClass}>
							<p className="text-foreground text-sm leading-relaxed">{m.landing_feature_catalog()}</p>
						</li>
						<li className={featureCardClass}>
							<p className="text-foreground text-sm leading-relaxed">{m.landing_feature_plants()}</p>
						</li>
						<li className={featureCardClass}>
							<p className="text-foreground text-sm leading-relaxed">{m.landing_feature_locations()}</p>
						</li>
						<li className={featureCardClass}>
							<p className="text-foreground text-sm leading-relaxed">{m.landing_feature_events()}</p>
						</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-2 font-heading font-medium text-foreground text-lg md:text-xl">
						{m.landing_sectionPreview()}
					</h2>
					<SignedOut>
						<p className="mb-5 max-w-prose text-muted-foreground text-sm">{m.landing_previewHint()}</p>
					</SignedOut>
					<SignedIn>
						<p className="mb-5 max-w-prose text-muted-foreground text-sm">{m.landing_previewHintSignedIn()}</p>
					</SignedIn>
					<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						<LandingPreviewLink
							cardClass={cn(previewCardClass)}
							authedTo="/catalog/species"
							authedSearch={{ category: "" }}
						>
							{m.components_hub_catalogLinkPrefix()} {m.collections_species_titlePlural()}
						</LandingPreviewLink>
						<LandingPreviewLink cardClass={cn(previewCardClass)} authedTo="/catalog/species-categories">
							{m.components_hub_catalogLinkPrefix()} {m.collections_speciesCategory_titlePlural()}
						</LandingPreviewLink>
						<LandingPreviewLink
							cardClass={cn(previewCardClass)}
							authedTo="/catalog/cultivars"
							authedSearch={{ category: "", species: "" }}
						>
							{m.components_hub_catalogLinkPrefix()} {m.collections_cultivar_titlePlural()}
						</LandingPreviewLink>
						<LandingPreviewLink
							cardClass={cn(previewCardClass)}
							authedTo="/plants"
							authedSearch={{ category: "", species: "", cultivar: "" }}
						>
							{m.collections_plant_titlePlural()}
						</LandingPreviewLink>
						<LandingPreviewLink cardClass={cn(previewCardClass)} authedTo="/locations">
							{m.collections_location_titlePlural()}
						</LandingPreviewLink>
						<LandingPreviewLink cardClass={cn(previewCardClass)} authedTo="/gardening-events">
							{m.collections_gardeningEvent_titlePlural()}
						</LandingPreviewLink>
					</ul>
				</section>
			</main>
		</div>
	);
}
