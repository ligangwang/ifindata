import type { Metadata } from "next";
import { WatchlistDetailPage } from "@/components/watchlist-detail-page";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { noIndexRobots } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; watchlistId: string }>;
}): Promise<Metadata> {
  const { id, watchlistId } = await params;
  const db = getAdminFirestore();

  try {
    const [watchlistSnapshot, userSnapshot] = await Promise.all([
      db.collection("watchlists").doc(watchlistId).get(),
      db.collection("users").doc(id).get(),
    ]);

    if (!watchlistSnapshot.exists || !userSnapshot.exists) {
      return {
        title: "Watchlist not found | YouAnalyst",
        robots: noIndexRobots(),
      };
    }

    const watchlist = watchlistSnapshot.data() as Record<string, unknown>;
    const user = userSnapshot.data() as Record<string, unknown>;
    const settings = user.settings && typeof user.settings === "object"
      ? user.settings as Record<string, unknown>
      : null;

    if (watchlist.userId !== id || settings?.isPublic === false || watchlist.archivedAt) {
      return {
        title: "Watchlist not found | YouAnalyst",
        robots: noIndexRobots(),
      };
    }

    const nickname = typeof user.nickname === "string" ? user.nickname.trim() : "";
    const displayName = typeof user.displayName === "string" ? user.displayName.trim() : "";
    const ownerLabel = nickname ? `@${nickname}` : displayName || "Analyst";
    const watchlistName = typeof watchlist.name === "string" ? watchlist.name.trim() : "Watchlist";
    const descriptionValue = typeof watchlist.description === "string" ? watchlist.description.trim() : "";
    const title = `${watchlistName} | ${ownerLabel} | YouAnalyst`;
    const description = descriptionValue || `${ownerLabel}'s public ${watchlistName} watchlist on YouAnalyst.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/analysts/${id}/watchlists/${watchlistId}`,
      },
      openGraph: {
        title,
        description,
        url: `/analysts/${id}/watchlists/${watchlistId}`,
      },
      twitter: {
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Watchlist | YouAnalyst",
      description: "Browse a public analyst watchlist on YouAnalyst.",
      alternates: {
        canonical: `/analysts/${id}/watchlists/${watchlistId}`,
      },
    };
  }
}

export default async function AnalystWatchlistPage({
  params,
}: {
  params: Promise<{ id: string; watchlistId: string }>;
}) {
  const { id, watchlistId } = await params;
  return <WatchlistDetailPage analystUserId={id} watchlistId={watchlistId} />;
}
