export type FollowListKind = "followers" | "following";

export type FollowListItem = {
  userId: string;
  displayName: string | null;
  nickname: string | null;
  photoURL: string | null;
  totalScore: number;
  followersCount: number;
  followingCount: number;
  followedAt: string;
};

type FollowListResult = {
  items: FollowListItem[];
  nextCursor: string | null;
};

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function statsFromUser(data: Record<string, unknown> | undefined) {
  const stats = (data?.stats as Record<string, unknown> | undefined) ?? {};

  return {
    totalScore: asNumber(stats.totalScore),
    followersCount: asNumber(stats.followersCount),
    followingCount: asNumber(stats.followingCount),
  };
}

export async function listFollowUsers(
  db: FirebaseFirestore.Firestore,
  userId: string,
  kind: FollowListKind,
  limit: number,
  cursorCreatedAt?: string,
): Promise<FollowListResult | null> {
  const userRef = db.collection("users").doc(userId);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    return null;
  }

  let query: FirebaseFirestore.Query = userRef
    .collection(kind)
    .orderBy("createdAt", "desc")
    .limit(limit + 1);

  if (cursorCreatedAt) {
    query = query.startAfter(cursorCreatedAt);
  }

  const snapshot = await query.get();
  const docs = snapshot.docs;
  const hasMore = docs.length > limit;
  const selected = hasMore ? docs.slice(0, limit) : docs;
  const userIds = selected.map((doc) => stringOrNull(doc.get("userId")) ?? doc.id);
  const userSnapshots = userIds.length > 0
    ? await db.getAll(...userIds.map((id) => db.collection("users").doc(id)))
    : [];
  const usersById = new Map(userSnapshots.map((doc) => [doc.id, doc.data() as Record<string, unknown> | undefined]));

  const items = selected.map((doc, index) => {
    const relationshipData = doc.data() as Record<string, unknown>;
    const relatedUserId = userIds[index] ?? doc.id;
    const userData = usersById.get(relatedUserId);
    const stats = statsFromUser(userData);
    const createdAt = stringOrNull(relationshipData.createdAt);

    return {
      userId: relatedUserId,
      displayName: stringOrNull(userData?.displayName) ?? stringOrNull(relationshipData.displayName),
      nickname: stringOrNull(userData?.nickname) ?? stringOrNull(relationshipData.nickname),
      photoURL: stringOrNull(userData?.photoURL) ?? stringOrNull(relationshipData.photoURL),
      totalScore: stats.totalScore,
      followersCount: stats.followersCount,
      followingCount: stats.followingCount,
      followedAt: createdAt ?? "",
    };
  });

  const nextCursor = hasMore && selected.length > 0 ? selected[selected.length - 1].get("createdAt") : null;

  return {
    items,
    nextCursor: typeof nextCursor === "string" ? nextCursor : null,
  };
}
