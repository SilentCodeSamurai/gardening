import type { GardeningActionType } from "@backend/core/domain/gardening/enums";
import * as m from "@/paraglide/messages.js";

const labelByAction: Record<GardeningActionType, () => string> = {
	watering: m.gardeningActions_watering,
	fertilization: m.gardeningActions_fertilization,
	pruning: m.gardeningActions_pruning,
	harvesting: m.gardeningActions_harvesting,
	transplanting: m.gardeningActions_transplanting,
	note: m.gardeningActions_note,
};

/** Localized label for a gardening action `type` (Paraglide-friendly; avoids dynamic message keys). */
export function gardeningActionMessage(type: GardeningActionType): string {
	return labelByAction[type]();
}
