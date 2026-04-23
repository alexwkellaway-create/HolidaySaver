"use client";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Settings, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ConfettiCannon } from "@/components/confetti-cannon";
import { useEffect, useRef } from "react";

interface PartyHeaderProps {
  party: {
    id: string;
    name: string;
    destination: string;
    coverEmoji: string;
    targetAmount: number;
    targetDate: string;
    host: { id: string; name: string | null; avatarEmoji: string };
  };
  totalRaised: number;
  percentComplete: number;
  isHost: boolean;
}

const MILESTONES = [25, 50, 75, 100];

export function PartyHeader({ party, totalRaised, percentComplete, isHost }: PartyHeaderProps) {
  const firedRef = useRef(new Set<number>());
  const confettiRef = useRef<{ fire: () => void } | null>(null);

  const daysLeft = differenceInDays(new Date(party.targetDate), new Date());

  // Fire confetti when we first render at a milestone
  useEffect(() => {
    const nearest = MILESTONES.find((m) => percentComplete >= m && !firedRef.current.has(m));
    if (nearest && confettiRef.current) {
      firedRef.current.add(nearest);
      confettiRef.current.fire();
    }
  }, [percentComplete]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg">
      {/* Cover strip */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 flex items-end px-6 pb-4">
        <div className="absolute inset-0 flex items-center justify-center opacity-10 text-9xl pointer-events-none select-none">
          {party.coverEmoji}
        </div>
        <div className="relative flex items-end gap-4 w-full">
          <div className="text-6xl">{party.coverEmoji}</div>
          <div className="flex-1 text-white">
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight drop-shadow">{party.name}</h1>
            <p className="text-orange-100 text-sm">{party.destination}</p>
          </div>
          {isHost && (
            <Link href={`/parties/${party.id}/settings`}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white dark:bg-slate-800 px-6 py-4 space-y-3">
        {/* Amount row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-extrabold text-orange-500 tabular-nums">
              {formatCurrency(totalRaised)}
            </p>
            <p className="text-sm text-muted-foreground">
              raised of {formatCurrency(party.targetAmount)} target
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{percentComplete.toFixed(0)}%</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
              <Calendar className="h-3.5 w-3.5" />
              {daysLeft > 0
                ? `${daysLeft} days to go`
                : daysLeft === 0
                ? "Holiday today! 🎉"
                : format(new Date(party.targetDate), "d MMM yyyy")}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <Progress
          value={percentComplete}
          className="h-4"
          indicatorClassName={
            percentComplete >= 100
              ? "bg-gradient-to-r from-green-400 to-emerald-400"
              : "bg-gradient-to-r from-orange-400 to-amber-400"
          }
        />

        {/* Milestone markers */}
        <div className="flex justify-between text-xs text-muted-foreground px-0.5">
          {MILESTONES.map((m) => (
            <span
              key={m}
              className={percentComplete >= m ? "text-orange-500 font-semibold" : ""}
            >
              {m}%{m === 100 ? " 🎉" : ""}
            </span>
          ))}
        </div>
      </div>

      <ConfettiCannon ref={confettiRef} />
    </div>
  );
}
