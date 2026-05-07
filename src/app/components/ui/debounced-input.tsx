import { useDebouncedValue } from "@tanstack/react-pacer";
import { XIcon } from "lucide-react";
import { type ComponentProps, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DebouncedInputProps = Omit<ComponentProps<typeof Input>, "onChange" | "value"> & {
	value: string;
	onChange: (value: string) => void;
	debounceMs?: number;
	showClear?: boolean;
	clearAriaLabel?: string;
};

export const RECOMMENDED_DEBOUNCE_MS = 250;

export function DebouncedInput({
	value,
	onChange,
	debounceMs = RECOMMENDED_DEBOUNCE_MS,
	showClear = false,
	clearAriaLabel = "Clear",
	className,
	...props
}: DebouncedInputProps) {
	const [localValue, setLocalValue] = useState(value);
	const [debouncedValue] = useDebouncedValue(localValue, { wait: debounceMs });
	const allowDebouncedPropagationRef = useRef(false);

	useLayoutEffect(() => {
		allowDebouncedPropagationRef.current = false;
		setLocalValue(value);
	}, [value]);

	useEffect(() => {
		if (!allowDebouncedPropagationRef.current) return;
		// Ignore stale debounced emissions (e.g. old text arriving after clear).
		if (debouncedValue !== localValue) {
			return;
		}
		if (debouncedValue !== value) onChange(debouncedValue);
	}, [debouncedValue, localValue, onChange, value]);

	return (
		<div className="relative">
			<Input
				{...props}
				className={cn(showClear && "pr-7", className)}
				value={localValue}
				onChange={(event) => {
					allowDebouncedPropagationRef.current = true;
					setLocalValue(event.target.value);
				}}
			/>
			{showClear && localValue !== "" ? (
				<button
					type="button"
					onClick={() => {
						allowDebouncedPropagationRef.current = false;
						setLocalValue("");
						onChange("");
					}}
					className="absolute top-1/2 right-1 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
					aria-label={clearAriaLabel}
				>
					<XIcon className="size-3.5" aria-hidden />
				</button>
			) : null}
		</div>
	);
}
