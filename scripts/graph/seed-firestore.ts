import { getAdminFirestore } from "@/lib/firebase/admin";
import { applyGraphMigration } from "./migration-runner";
import { seedGraphMigration } from "./migrations/001-seed-graph";

async function seedGraph() {
  const db = getAdminFirestore();
  await applyGraphMigration(db, seedGraphMigration);
}

seedGraph().catch((error) => {
  console.error("Failed to seed Firestore graph data:", error);
  process.exitCode = 1;
});
