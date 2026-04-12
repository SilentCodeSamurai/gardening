import { OrganizationView } from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/organization/$organizationView")({
	component: OrganizationSettingsRoute,
});

function OrganizationSettingsRoute() {
	const { organizationView } = Route.useParams();

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
			<OrganizationView pathname={organizationView} />
		</div>
	);
}
