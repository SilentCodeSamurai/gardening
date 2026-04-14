import type { DependencyContainer } from "tsyringe";
import { AccessAuditPortToken } from "../core/application/ports/access/access-audit.port";
import { NoopResourceAccessAudit } from "../infrastructure/adapters/audit/noop-resource-access-audit";

/** Registers infrastructure adapters on DI tokens. */
export function registerAdapters(c: DependencyContainer): void {
	c.register(AccessAuditPortToken, {
		useValue: new NoopResourceAccessAudit(),
	});
}
