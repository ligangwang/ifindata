import type * as admin from "firebase-admin";

export type GraphMigration = {
  id: string;
  name: string;
  run: (db: admin.firestore.Firestore) => Promise<void>;
};

function getMigrationRef(db: admin.firestore.Firestore, id: string) {
  return db.collection("_migrations").doc(id);
}

export async function applyGraphMigration(
  db: admin.firestore.Firestore,
  migration: GraphMigration,
): Promise<boolean> {
  const migrationRef = getMigrationRef(db, migration.id);
  const migrationSnap = await migrationRef.get();

  if (migrationSnap.exists) {
    console.log(`Migration ${migration.id} already applied. Skipping.`);
    return false;
  }

  await migration.run(db);

  await migrationRef.set({
    id: migration.id,
    name: migration.name,
    appliedAt: new Date().toISOString(),
  });

  console.log(`Applied migration ${migration.id}: ${migration.name}`);
  return true;
}

export async function runGraphMigrations(
  db: admin.firestore.Firestore,
  migrations: GraphMigration[],
): Promise<void> {
  for (const migration of migrations) {
    await applyGraphMigration(db, migration);
  }
}
