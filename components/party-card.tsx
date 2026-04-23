import Link from "next/link";
import { formatCurrency, progressMessage } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface PartyCardProps {
  party: {
    id: string;
    name: string;
    destination: string;
    targetAmount: number;
    targetDate: Date | string;
    coverEmoji: string;
    hostId: string;
    host: { id: string; name: string | null; avatarEmoji: string };
    members: Array<{ user: { id: string; name: string | null; avatarEmoji: string } }>;
    _count: { contributions: number };
  };
  totalRaised: number;
  currentUserId: string;
}

export function PartyCard({ party, totalRaised, currentUserId }: PartyCardProps) {
  const pct = Math.min(100, (totalRaised / party.targetAmount) * 100);
  const daysLeft = differenceInDays(new Date(party.targetDate), new Date());
  const isHost = party.hostId === currentUserId;

  return (
    <Link href={`/parties/${party.id}`} className="block group">
      <div className="rounded-2xl border bg-card hover:shadow-lg transition-all duration-200 group-hover:-translate-y-0.5 overflow-hidden">
        {/* Cover strip */}
        <div className="h-16 bg-gradient-to-r from-orange-400 to-amber-400 flex items-center px-6 gap-3">
          <span className="text-4xl">{party.coverEmoji}</span>
          <div className="text-white">
            <p className="font-bold leading-tight truncate">{party.name}</p>
            <p className="text-xs text-orange-100">{party.destination}</p>
          </div>
          {isHost && (
            <Badge variant="sunset" className="ml-auto text-xs bg-white/20 text-white border-white/30">
              Host
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-bold">{formatCurrency(totalRaised)}</span>
              <span className="text-muted-foreground">of {formatCurrency(party.targetAmount)}</span>
            </div>
            <Progress value={pct} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-1.5">{pct.toFixed(0)}% raised</p>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{party.members.length} member{party.members.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {daysLeft > 0
                  ? `${daysLeft}d to go`
                  : daysLeft === 0
                  ? "Today! 🎉"
                  : format(new Date(party.targetDate), "d MMM yyyy")}
              </span>
            </div>
          </div>

          {/* Member avatars */}
          <div className="flex items-center gap-1 pt-0.5">
            {party.members.slice(0, 6).map((m) => (
              <span key={m.user.id} className="text-lg" title={m.user.name ?? ""}>
                {m.user.avatarEmoji}
              </span>
            ))}
            {party.members.length > 6 && (
              <span className="text-xs text-muted-foreground ml-1">+{party.members.length - 6} more</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
