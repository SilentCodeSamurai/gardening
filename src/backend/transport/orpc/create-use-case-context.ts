import { SubjectVO } from "@backend/core/domain/access/subject.vo";
import type { UseCaseContext } from "#/backend/core/application/use-cases/use-case-context";
import { WorkspaceVO } from "#/backend/core/domain/access/workspace.vo";
import type { AuthenticatedOrpcContext } from "./orpc-procedure";

/**
 * Maps Better Auth `getSession` result to {@link UseCaseContext} for use cases.
 */
export function createUseCaseContextFromOrpc(context: AuthenticatedOrpcContext): UseCaseContext {
	const userId = context.authSession.user.id;
	const activeOrganizationId = context.authSession.session.activeOrganizationId;
	const actorSubject = SubjectVO.user(userId);
	const activeWorkspaceScope = activeOrganizationId
		? WorkspaceVO.org(activeOrganizationId)
		: WorkspaceVO.user(userId);
	return {
		actorSubject,
		activeWorkspaceScope,
	};
}
