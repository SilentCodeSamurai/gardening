import type { ACCESS_ACTION, ACCESS_DECISION_REASON_CODE, ACCESS_ROLE } from "./enums";

export type AccessAction = (typeof ACCESS_ACTION)[keyof typeof ACCESS_ACTION];
export type AccessRole = (typeof ACCESS_ROLE)[keyof typeof ACCESS_ROLE];
export type AccessDecisionReasonCode = (typeof ACCESS_DECISION_REASON_CODE)[keyof typeof ACCESS_DECISION_REASON_CODE];

export type AccessDecision = {
	readonly allowed: boolean;
	readonly action: AccessAction;
	readonly reasonCode: AccessDecisionReasonCode;
	readonly matchedRole?: AccessRole;
	/** Stable opaque key of the assignment row if applicable */
	readonly matchedAssignmentId?: string;
};

const ROLE_ACTIONS: Record<AccessRole, ReadonlySet<AccessAction>> = {
	viewer: new Set(["read"]),
	editor: new Set(["read", "create", "update"]),
	admin: new Set(["read", "create", "update", "delete", "grantPermission"]),
};

export function accessRoleAllows(role: AccessRole, action: AccessAction): boolean {
	return ROLE_ACTIONS[role].has(action);
}

export function accessRoleOrder(role: AccessRole): number {
	switch (role) {
		case "viewer":
			return 0;
		case "editor":
			return 1;
		case "admin":
			return 2;
	}
}
