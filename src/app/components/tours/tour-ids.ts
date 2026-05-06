export const APP_TOUR_IDS = [
	"localization-personalization",
	"app-overview",
	"working-with-data",
	"layout-editor-guide",
] as const;

export type AppTourId = (typeof APP_TOUR_IDS)[number];
