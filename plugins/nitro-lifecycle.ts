import { definePlugin } from "nitro";
import { ensureBackendBootstrap } from "../src/backend/lifecycle/server-bootstrap";
import { ensureBackendShutdown } from "../src/backend/lifecycle/server-shutdown";

export default definePlugin((nitroApp) => {
	console.info("[nitro] Lifecycle plugin initialized.");

	nitroApp.hooks.hook("request", async () => {
		await ensureBackendBootstrap();
	});

	nitroApp.hooks.hook("close", async () => {
		console.info("[nitro] close hook.");
		await ensureBackendShutdown();
	});
});
