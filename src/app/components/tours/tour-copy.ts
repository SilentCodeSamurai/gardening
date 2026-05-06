import * as m from "@/paraglide/messages.js";
import type { AppTourId } from "@/components/tours/tour-ids";

type TourCopy = {
	name: string;
	steps: Array<{ title: string; content: string }>;
};

export function getTourCopy(id: AppTourId): TourCopy {
	const registry: Record<AppTourId, TourCopy> = {
		"localization-personalization": {
			name: m.tours_localizationPersonalization_name(),
			steps: [
				{ title: m.tours_localizationPersonalization_step1_title(), content: m.tours_localizationPersonalization_step1_content() },
				{ title: m.tours_localizationPersonalization_step2_title(), content: m.tours_localizationPersonalization_step2_content() },
				{ title: m.tours_localizationPersonalization_step3_title(), content: m.tours_localizationPersonalization_step3_content() },
				{ title: m.tours_localizationPersonalization_step4_title(), content: m.tours_localizationPersonalization_step4_content() },
			],
		},
		"app-overview": {
			name: m.tours_appOverview_name(),
			steps: [
				{ title: m.tours_appOverview_step1_title(), content: m.tours_appOverview_step1_content() },
				{ title: m.tours_appOverview_step2_title(), content: m.tours_appOverview_step2_content() },
				{ title: m.tours_appOverview_step3_title(), content: m.tours_appOverview_step3_content() },
				{ title: m.tours_appOverview_step4_title(), content: m.tours_appOverview_step4_content() },
				{ title: m.tours_appOverview_step5_title(), content: m.tours_appOverview_step5_content() },
				{ title: m.tours_appOverview_step6_title(), content: m.tours_appOverview_step6_content() },
				{ title: m.tours_appOverview_step7_title(), content: m.tours_appOverview_step7_content() },
				{ title: m.tours_appOverview_step8_title(), content: m.tours_appOverview_step8_content() },
				{ title: m.tours_appOverview_step9_title(), content: m.tours_appOverview_step9_content() },
				{ title: m.tours_appOverview_step10_title(), content: m.tours_appOverview_step10_content() },
				{ title: m.tours_appOverview_step11_title(), content: m.tours_appOverview_step11_content() },
				{ title: m.tours_appOverview_step12_title(), content: m.tours_appOverview_step12_content() },
				{ title: m.tours_appOverview_step13_title(), content: m.tours_appOverview_step13_content() },
				{ title: m.tours_appOverview_step14_title(), content: m.tours_appOverview_step14_content() },
				{ title: m.tours_appOverview_step15_title(), content: m.tours_appOverview_step15_content() },
				{ title: m.tours_appOverview_step16_title(), content: m.tours_appOverview_step16_content() },
				{ title: m.tours_appOverview_step17_title(), content: m.tours_appOverview_step17_content() },
				{ title: m.tours_appOverview_step18_title(), content: m.tours_appOverview_step18_content() },
				{ title: m.tours_appOverview_step19_title(), content: m.tours_appOverview_step19_content() },
				{ title: m.tours_appOverview_step20_title(), content: m.tours_appOverview_step20_content() },
				{ title: m.tours_appOverview_step21_title(), content: m.tours_appOverview_step21_content() },
				{ title: m.tours_appOverview_step22_title(), content: m.tours_appOverview_step22_content() },
				{ title: m.tours_appOverview_step23_title(), content: m.tours_appOverview_step23_content() },
				{ title: m.tours_appOverview_step24_title(), content: m.tours_appOverview_step24_content() },
				{ title: m.tours_appOverview_step25_title(), content: m.tours_appOverview_step25_content() },
				{ title: m.tours_appOverview_step26_title(), content: m.tours_appOverview_step26_content() },
				{ title: m.tours_appOverview_step27_title(), content: m.tours_appOverview_step27_content() },
				{ title: m.tours_appOverview_step28_title(), content: m.tours_appOverview_step28_content() },
				{ title: m.tours_appOverview_step29_title(), content: m.tours_appOverview_step29_content() },
				{ title: m.tours_appOverview_step30_title(), content: m.tours_appOverview_step30_content() },
				{ title: m.tours_appOverview_step31_title(), content: m.tours_appOverview_step31_content() },
				{ title: m.tours_appOverview_step32_title(), content: m.tours_appOverview_step32_content() },
				{ title: m.tours_appOverview_step33_title(), content: m.tours_appOverview_step33_content() },
				{ title: m.tours_appOverview_step34_title(), content: m.tours_appOverview_step34_content() },
				{ title: m.tours_appOverview_step35_title(), content: m.tours_appOverview_step35_content() },
				{ title: m.tours_appOverview_step36_title(), content: m.tours_appOverview_step36_content() },
			],
		},
		"working-with-data": {
			name: m.tours_workingWithData_name(),
			steps: [
				{ title: m.tours_workingWithData_step1_title(), content: m.tours_workingWithData_step1_content() },
				{ title: m.tours_workingWithData_step2_title(), content: m.tours_workingWithData_step2_content() },
				{ title: m.tours_workingWithData_step3_title(), content: m.tours_workingWithData_step3_content() },
				{ title: m.tours_workingWithData_step4_title(), content: m.tours_workingWithData_step4_content() },
				{ title: m.tours_workingWithData_step5_title(), content: m.tours_workingWithData_step5_content() },
				{ title: m.tours_workingWithData_step6_title(), content: m.tours_workingWithData_step6_content() },
				{ title: m.tours_workingWithData_step7_title(), content: m.tours_workingWithData_step7_content() },
				{ title: m.tours_workingWithData_step8_title(), content: m.tours_workingWithData_step8_content() },
				{ title: m.tours_workingWithData_step9_title(), content: m.tours_workingWithData_step9_content() },
				{ title: m.tours_workingWithData_step10_title(), content: m.tours_workingWithData_step10_content() },
				{ title: m.tours_workingWithData_step11_title(), content: m.tours_workingWithData_step11_content() },
				{ title: m.tours_workingWithData_step12_title(), content: m.tours_workingWithData_step12_content() },
				{ title: m.tours_workingWithData_step13_title(), content: m.tours_workingWithData_step13_content() },
				{ title: m.tours_workingWithData_step14_title(), content: m.tours_workingWithData_step14_content() },
			],
		},
		"layout-editor-guide": {
			name: m.tours_layoutEditorGuide_name(),
			steps: [
				{ title: m.tours_layoutEditorGuide_step1_title(), content: m.tours_layoutEditorGuide_step1_content() },
				{ title: m.tours_layoutEditorGuide_step2_title(), content: m.tours_layoutEditorGuide_step2_content() },
				{ title: m.tours_layoutEditorGuide_step3_title(), content: m.tours_layoutEditorGuide_step3_content() },
				{ title: m.tours_layoutEditorGuide_step4_title(), content: m.tours_layoutEditorGuide_step4_content() },
				{ title: m.tours_layoutEditorGuide_step5_title(), content: m.tours_layoutEditorGuide_step5_content() },
				{ title: m.tours_layoutEditorGuide_step6_title(), content: m.tours_layoutEditorGuide_step6_content() },
				{ title: m.tours_layoutEditorGuide_step7_title(), content: m.tours_layoutEditorGuide_step7_content() },
				{ title: m.tours_layoutEditorGuide_step8_title(), content: m.tours_layoutEditorGuide_step8_content() },
				{ title: m.tours_layoutEditorGuide_step9_title(), content: m.tours_layoutEditorGuide_step9_content() },
				{ title: m.tours_layoutEditorGuide_step10_title(), content: m.tours_layoutEditorGuide_step10_content() },
				{ title: m.tours_layoutEditorGuide_step11_title(), content: m.tours_layoutEditorGuide_step11_content() },
				{ title: m.tours_layoutEditorGuide_step12_title(), content: m.tours_layoutEditorGuide_step12_content() },
				{ title: m.tours_layoutEditorGuide_step13_title(), content: m.tours_layoutEditorGuide_step13_content() },
				{ title: m.tours_layoutEditorGuide_step14_title(), content: m.tours_layoutEditorGuide_step14_content() },
			],
		},
	};
	return registry[id];
}
