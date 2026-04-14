import { registerAccessRepositoryContracts } from "../../contracts/access";

import { createMongoDBTestContainer } from "../create-mongodb-test-container";

registerAccessRepositoryContracts("mongodb", createMongoDBTestContainer);
