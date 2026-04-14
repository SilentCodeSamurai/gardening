import { registerGardeningRepositoryContracts } from "../../contracts/gardening";

import { createMongoDBTestContainer } from "../create-mongodb-test-container";

registerGardeningRepositoryContracts("mongodb", createMongoDBTestContainer);
