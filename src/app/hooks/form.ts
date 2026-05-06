import { createFormHook } from "@tanstack/react-form";

import {
	CatalogCombobox,
	ColorPicker,
	DatePicker,
	DateTimePicker,
	IconPicker,
	Select,
	Slider,
	SubscribeButton,
	Switch,
	TextArea,
	TextField,
} from "@/components/form";
import { fieldContext, formContext } from "@/hooks/form-context";

export const { useAppForm, withForm } = createFormHook({
	fieldComponents: {
		TextField,
		Select,
		CatalogCombobox,
		IconPicker,
		ColorPicker,
		DatePicker,
		DateTimePicker,
		TextArea,
		Slider,
		Switch,
	},
	formComponents: {
		SubscribeButton,
	},
	fieldContext,
	formContext,
});
