import { registerGardeningRepositoryContracts } from "../../contracts/gardening";

import { createInMemoryGardeningTestContainer } from "./create-in-memory-gardening-test-container";

registerGardeningRepositoryContracts("in-memory", createInMemoryGardeningTestContainer);
