import { getAdminFirestore } from "@/lib/firebase/admin";

export type LovedEntity = {
  id: string;
  entityId: number;
  entityType: string;
  createdAt: string;
};

function docId(userId: string, entityId: number, entityType: string): string {
  return `${userId}_${entityId}_${entityType}`;
}

export async function addLovedEntity(
  userId: string,
  entityId: number,
  entityType: string = "company",
): Promise<void> {
  const db = getAdminFirestore();
  const id = docId(userId, entityId, entityType);
  await db.collection("loved_entities").doc(id).set(
    { userId, entityId, entityType, createdAt: new Date().toISOString() },
    { merge: true },
  );
}

export async function removeLovedEntity(
  userId: string,
  entityId: number,
  entityType: string = "company",
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection("loved_entities").doc(docId(userId, entityId, entityType)).delete();
}

export async function getLovedEntities(
  userId: string,
  entityType?: string,
): Promise<LovedEntity[]> {
  const db = getAdminFirestore();
  let query = db.collection("loved_entities").where("userId", "==", userId);
  if (entityType) {
    query = query.where("entityType", "==", entityType);
  }
  const snapshot = await query.get();
  const results = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      entityId: data.entityId as number,
      entityType: data.entityType as string,
      createdAt: data.createdAt as string,
    };
  });
  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function isEntityLoved(
  userId: string,
  entityId: number,
  entityType: string = "company",
): Promise<boolean> {
  const db = getAdminFirestore();
  const doc = await db.collection("loved_entities").doc(docId(userId, entityId, entityType)).get();
  return doc.exists;
}
