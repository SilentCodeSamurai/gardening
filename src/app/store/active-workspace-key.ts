import type { WorkspaceKey } from "@backend/core/domain/access/workspace.vo";
import { WorkspaceVO } from "@backend/core/domain/access/workspace.vo";
import { useMemo } from "react";

import { authClient } from "@/lib/auth-client";

type SessionShape = {
	user: { id: string };
	session?: { activeOrganizationId?: string | null };
} | null;

/**
 * Matches {@link createUseCaseContextFromOrpc} so optimistic rows use the same workspace key as the API.
 */
export function activeWorkspaceKeyFromSession(session: SessionShape | undefined): WorkspaceKey | null {
	const userId = session?.user?.id;
	if (!userId) return null;
	const orgId = session?.session?.activeOrganizationId;
	return orgId ? WorkspaceVO.org(orgId).toKey() : WorkspaceVO.user(userId).toKey();
}

export function useActiveWorkspaceKey(): WorkspaceKey | null {
	const { data: session } = authClient.useSession();
	return useMemo(() => activeWorkspaceKeyFromSession(session ?? null), [session]);
}
