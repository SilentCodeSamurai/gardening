import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { organization } from "better-auth/plugins";
import { appContainer } from "#/backend/di/app-container";
import { MongoDBClient } from "../mongodb/client";
import { MongoDBDatabaseNameToken } from "../mongodb/injection-tokens";
import { grantDefaultPermissionsOnOrganizationCreated } from "./grant-default-permissions-on-organization-created";
import { grantDefaultPermissionsOnUserCreated } from "./grant-default-permissions-on-user-created";

export const betterAuthBackendClient = betterAuth({
	database: mongodbAdapter(appContainer.resolve(MongoDBClient).db(appContainer.resolve(MongoDBDatabaseNameToken))),
	plugins: [
		organization({
			organizationHooks: {
				afterCreateOrganization: async (data) => {
					await grantDefaultPermissionsOnOrganizationCreated(data);
				},
			},
		}),
	],
	emailAndPassword: {
		enabled: true,
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await grantDefaultPermissionsOnUserCreated(user);
				},
			},
		},
	},
});
