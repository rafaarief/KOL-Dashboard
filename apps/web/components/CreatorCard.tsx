import { SaveToShortlistButton } from "./SaveToShortlistButton";

export interface CreatorResultRow {
  result: {
    id: string;
    finalScore: string;
    rankingLabel: string;
    rankingExplanation: string;
    rankPosition: number;
    discoveryKeywords: unknown;
  };
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    profileUrl: string;
    profileImageUrl: string | null;
    primaryNiche: string | null;
    inferredLocation: string | null;
    followerCount: number | null;
    totalLikeCount: number | null;
  };
  video: {
    videoUrl: string;
    viewCount: number | null;
    publishedAt: string | null;
  } | null;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return "unknown date";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function CreatorCard({ row }: { row: CreatorResultRow }) {
  const { result, creator, video } = row;
  const discoveryKeywords = Array.isArray(result.discoveryKeywords) ? (result.discoveryKeywords as string[]) : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-slate-500">#{result.rankPosition}</span>
          <img
            src={creator.profileImageUrl ?? "https://placehold.co/48x48"}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-slate-900">{creator.displayName ?? creator.username}</p>
            <p className="text-sm text-slate-500">@{creator.username}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-indigo-600">{Number(result.finalScore).toFixed(0)}%</p>
          <p className="text-xs text-slate-500">{result.rankingLabel}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-4">
        <div>
          <p className="text-slate-500">Niche</p>
          <p>{creator.primaryNiche ?? "Unclassified"}</p>
        </div>
        <div>
          <p className="text-slate-500">Location</p>
          <p>{creator.inferredLocation ?? "Unknown"}</p>
        </div>
        <div>
          <p className="text-slate-500">Followers</p>
          <p>{formatNumber(creator.followerCount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Profile likes</p>
          <p>{formatNumber(creator.totalLikeCount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Relevant video views</p>
          <p>{formatNumber(video?.viewCount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Uploaded</p>
          <p>{formatRelativeDate(video?.publishedAt ?? null)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-slate-500">Discovered via</p>
          <p>{discoveryKeywords.join(", ") || "—"}</p>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">{result.rankingExplanation}</p>

      <div className="mt-4 flex items-center gap-3">
        <a
          href={creator.profileUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 hover:border-indigo-500"
        >
          Open Profile
        </a>
        {video && (
          <a
            href={video.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 hover:border-indigo-500"
          >
            Open Video
          </a>
        )}
        <SaveToShortlistButton creatorId={creator.id} searchResultId={result.id} />
      </div>
    </div>
  );
}
