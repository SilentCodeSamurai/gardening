import "reflect-metadata";
import { config as loadEnvConfig } from "dotenv";

// Load envs explicitly for Vitest with predictable precedence.
loadEnvConfig({ path: ".env" });
loadEnvConfig({ path: ".env.local", override: true });
loadEnvConfig({ path: ".env.test", override: true });
loadEnvConfig({ path: ".env.test.local", override: true });

