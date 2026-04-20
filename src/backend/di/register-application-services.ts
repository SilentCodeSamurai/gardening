import type { DependencyContainer, InjectionToken } from "tsyringe";
import { AccessControlApplicationService } from "../core/application/services/access-control/access-control.application-service";
import { SpatialNodeRefApplicationService } from "../core/application/services/spatial/spatial-node-ref.application-service";
import { SpatialPlacementDomainService } from "../core/domain/services/spatial-placement.domain-service";

const injectableApplicationServices = [
	AccessControlApplicationService,
	SpatialNodeRefApplicationService,
	SpatialPlacementDomainService,
] as const;

/** Registers application services (constructor injection via @injectable). */
export function registerApplicationServices(c: DependencyContainer): void {
	for (const cls of injectableApplicationServices) {
		c.register(cls as InjectionToken<object>, { useClass: cls });
	}
}
