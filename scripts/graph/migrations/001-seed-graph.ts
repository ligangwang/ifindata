import type * as admin from "firebase-admin";
import { seededCompanies, seededRelationships } from "@/lib/graph/seed";
import type { GraphMigration } from "../migration-runner";

export const seedGraphMigration: GraphMigration = {
  id: "001_seed_graph",
  name: "Seed graph data",
  async run(db: admin.firestore.Firestore): Promise<void> {
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

    await batch.commit();

    console.log(
      `Seeded ${seededCompanies.length} companies and ${seededRelationships.length} relationships into Firestore.`,
    );
  },
};
