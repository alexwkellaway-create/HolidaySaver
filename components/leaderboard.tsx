import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface MemberTotal {
  member: {
    userId: string;
    user: { id: string; name: string | null; avatarEmoji: string };
  };
  totalContributed: number;
}

interface LeaderboardProps {
  memberTotals: MemberTotal[];
  currentUserId: string;
}

const RANK_LABELS = ["🥇", "🥈", "🥉"];
const TITLES = ["Top contributor! 🏆", "Rising star ⭐", "Keeping up 💪", "Just getting started 🌱"];

export function Leaderboard({ memberTotals, currentUserId }: LeaderboardProps) {
  const sorted = [...memberTotals]
    .filter((m) => m.totalContributed > 0)
    .sort((a, b) => b.totalContributed - a.totalContributed);

  if (sorted.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((m, i) => {
          const isYou = m.member.userId === currentUserId;
          const rank = RANK_LABELS[i] ?? `${i + 1}.`;
          const title = TITLES[Math.min(i, TITLES.length - 1)];

          return (
            <div
              key={m.member.userId}
              className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors ${
                isYou
                  ? "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900"
                  : "hover:bg-muted/50"
              }`}
            >
              <span className="text-xl w-6 text-center">{rank}</span>
              <span className="text-xl">{m.member.user.avatarEmoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {m.member.user.name ?? "Unknown"}
                  {isYou && <span className="text-orange-500 ml-1 text-xs">(you)</span>}
                </p>
                {i === 0 && <p className="text-xs text-amber-600 dark:text-amber-400">{title}</p>}
              </div>
              <span className="text-sm font-bold tabular-nums text-orange-500">
                {formatCurrency(m.totalContributed)}
              </span>
            </div>
          );
        })}

        {/* Members with no contributions yet */}
        {memberTotals
          .filter((m) => m.totalContributed === 0)
          .map((m) => (
            <div key={m.member.userId} className="flex items-center gap-3 rounded-xl p-2.5 opacity-50">
              <span className="text-xl w-6 text-center">—</span>
              <span className="text-xl">{m.member.user.avatarEmoji}</span>
              <p className="flex-1 text-sm text-muted-foreground truncate">
                {m.member.user.name ?? "Unknown"}
                {m.member.userId === currentUserId && " (you)"}
              </p>
              <span className="text-xs text-muted-foreground">£0</span>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
