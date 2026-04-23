import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MemberTotal {
  member: {
    id: string;
    userId: string;
    personalTarget: number | null;
    joinedAt: string;
    user: { id: string; name: string | null; avatarEmoji: string };
  };
  totalContributed: number;
  target: number;
}

interface ProgressSectionProps {
  memberTotals: MemberTotal[];
  totalRaised: number;
  targetAmount: number;
}

export function ProgressSection({ memberTotals, totalRaised, targetAmount }: ProgressSectionProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Per-person progress 👥</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {memberTotals
          .sort((a, b) => b.totalContributed - a.totalContributed)
          .map(({ member, totalContributed, target }) => {
            const pct = Math.min(100, (totalContributed / target) * 100);
            return (
              <div key={member.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{member.user.avatarEmoji}</span>
                    <span className="font-medium truncate max-w-[100px]">
                      {member.user.name ?? "Unknown"}
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-semibold">{formatCurrency(totalContributed)}</span>
                    <span className="text-muted-foreground"> / {formatCurrency(target)}</span>
                  </div>
                </div>
                <Progress
                  value={pct}
                  className="h-2"
                  indicatorClassName={
                    pct >= 100
                      ? "bg-gradient-to-r from-green-400 to-emerald-400"
                      : "bg-gradient-to-r from-orange-400 to-amber-300"
                  }
                />
              </div>
            );
          })}

        {/* Grand total */}
        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm font-semibold">
            <span>Total raised</span>
            <span className="text-orange-500">{formatCurrency(totalRaised)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Target</span>
            <span>{formatCurrency(targetAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
