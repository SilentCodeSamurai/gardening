import * as m from "@/paraglide/messages.js";

type MessageResolver = () => string;

type ApplicationErrorPayload = {
	discriminator: "application_error";
	i18nMessageKey: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
	return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function getApplicationErrorPayload(error: unknown): ApplicationErrorPayload | null {
	const fromRoot = asRecord(error);
	if (
		fromRoot?.discriminator === "application_error" &&
		typeof fromRoot.i18nMessageKey === "string" &&
		fromRoot.i18nMessageKey.length > 0
	) {
		return {
			discriminator: "application_error",
			i18nMessageKey: fromRoot.i18nMessageKey,
		};
	}
	const data = asRecord(fromRoot?.data);
	if (
		data?.discriminator === "application_error" &&
		typeof data.i18nMessageKey === "string" &&
		data.i18nMessageKey.length > 0
	) {
		return {
			discriminator: "application_error",
			i18nMessageKey: data.i18nMessageKey,
		};
	}
	return null;
}

export function isApplicationError(error: unknown): error is ApplicationErrorPayload {
	return getApplicationErrorPayload(error) !== null;
}

export function renderError(error: unknown, fallbackMessage?: string): string {
	const payload = getApplicationErrorPayload(error);
	if (payload) {
		const table = m as Record<string, unknown>;
		const key = payload.i18nMessageKey.replaceAll(".", "_");
		const resolver = table[key];
		if (typeof resolver === "function") {
			return (resolver as MessageResolver)();
		}
	}
	return fallbackMessage ?? m.errors_application_unknown();
}
