import { QueryClient } from "@tanstack/react-query";

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				gcTime: 1 * 60 * 60 * 1000, // 1 hour
				staleTime: 1 * 60 * 60 * 1000, // 1 hour
			},
		},
	});

	return {
		queryClient,
	};
}
export default function TanstackQueryProvider() {}
