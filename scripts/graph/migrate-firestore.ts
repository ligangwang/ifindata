import { getAdminFirestore } from "@/lib/firebase/admin";
import { runGraphMigrations } from "./migration-runner";
import { graphMigrations } from "./migrations";

async function migrateGraph() {
  const db = getAdminFirestore();
  await runGraphMigrations(db, graphMigrations);
}

migrateGraph().catch((error) => {
  console.error("Failed to run Firestore graph migrations:", error);
  process.exitCode = 1;
});
