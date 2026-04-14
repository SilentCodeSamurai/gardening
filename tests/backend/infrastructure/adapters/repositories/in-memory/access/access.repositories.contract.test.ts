import { registerAccessRepositoryContracts } from "../../contracts/access";

import { createInMemoryAccessTestContainer } from "./create-in-memory-access-test-container";

registerAccessRepositoryContracts("in-memory", createInMemoryAccessTestContainer);
