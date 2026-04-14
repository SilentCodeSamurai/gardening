import { registerSpatialRepositoryContracts } from "../../contracts/spatial";

import { createInMemoryGardeningTestContainer } from "../gardening/create-in-memory-gardening-test-container";

registerSpatialRepositoryContracts("in-memory", createInMemoryGardeningTestContainer);
