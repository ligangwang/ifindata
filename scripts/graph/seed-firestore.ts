import { getAdminFirestore } from "@/lib/firebase/admin";
import { seededCompanies, seededRelationships } from "@/lib/graph/seed";

const MIGRATION_ID = "001_seed_graph";

async function seedGraph() {
  const db = getAdminFirestore();
  const migrationRef = db.collection("_migrations").doc(MIGRATION_ID);
  const migrationSnap = await migrationRef.get();

  if (migrationSnap.exists) {
    console.log(`Migration ${MIGRATION_ID} already applied. Skipping graph seed.`);
    return;
  }

  const batch = db.batch();

  for (const company of seededCompanies) {
    const ref = db.collection("companies").doc(String(company.id));
    batch.set(
      ref,
      {
        ...company,
        nameLower: company.name.toLowerCase(),
        tickerLower: company.ticker.toLowerCase(),
      },
      { merge: true },
    );
  }

  for (const relationship of seededRelationships) {
    const ref = db.collection("relationships").doc(String(relationship.id));
    batch.set(
      ref,
      {
        ...relationship,
      },
      { merge: true },
    );
  }

  batch.set(migrationRef, {
    id: MIGRATION_ID,
    name: "Seed graph data",
    appliedAt: new Date().toISOString(),
    companiesSeeded: seededCompanies.length,
    relationshipsSeeded: seededRelationships.length,
  });

  await batch.commit();

  console.log(
    `Seeded ${seededCompanies.length} companies and ${seededRelationships.length} relationships into Firestore.`,
  );
}

seedGraph().catch((error) => {
  console.error("Failed to seed Firestore graph data:", error);
  process.exitCode = 1;
});
