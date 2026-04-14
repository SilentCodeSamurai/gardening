import { registerSpatialRepositoryContracts } from "../../contracts/spatial";

import { createMongoDBTestContainer } from "../create-mongodb-test-container";

registerSpatialRepositoryContracts("mongodb", createMongoDBTestContainer);
