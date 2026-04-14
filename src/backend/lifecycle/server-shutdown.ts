import { appContainer } from "@backend/di/app-container";
import { MongoDBClient } from "@backend/infrastructure/integrations/mongodb/client";
import { isBackendBootstrapped } from "./server-bootstrap";

let shutdownOnce: Promise<void> | undefined;

/**
 * Runs server-side backend teardown once per process.
 */
export function ensureBackendShutdown(): Promise<void> {
	shutdownOnce ??= (async () => {
		if (!isBackendBootstrapped()) {
			console.info("[shutdown] Backend not bootstrapped; skipping teardown.");
			return;
		}

		try {
			console.info("[shutdown] Starting backend teardown...");
			const mongoClient = appContainer.resolve(MongoDBClient);
			await mongoClient.close();
			console.info("[shutdown] MongoDB client disconnected.");
		} catch (error) {
			console.error("[shutdown] Backend shutdown failed:", error);
			throw error;
		}
	})();

	return shutdownOnce;
}
