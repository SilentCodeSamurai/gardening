import type { WorkspaceVO } from "@backend/core/domain/access/workspace.vo";

export function workspacesEqual(a: WorkspaceVO, b: WorkspaceVO): boolean {
	return a.equals(b);
}
