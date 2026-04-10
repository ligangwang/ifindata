import type { GraphMigration } from "../migration-runner";
import { seedGraphMigration } from "./001-seed-graph";

export const graphMigrations: GraphMigration[] = [seedGraphMigration];
