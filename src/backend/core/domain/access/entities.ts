import type { BaseEntity, BaseEntityId } from "../shared/entities";
import type { SubjectKey } from "./subject.vo";
import type { AccessRole } from "./types";
import type { WorkspaceKey } from "./workspace.vo";

/**
 * Identifier for a workspace role assignment.
 */
export type WorkspaceRoleAssignmentEntityId = BaseEntityId<string, "WorkspaceRoleAssignment">;

/**
 * Persisted role assignment for a subject on a workspace scope.
 */
export type WorkspaceRoleAssignmentEntity = BaseEntity<WorkspaceRoleAssignmentEntityId> & {
	readonly subjectKey: SubjectKey;
	readonly workspaceKey: WorkspaceKey;
	readonly role: AccessRole;
	readonly grantSource?: string;
};

