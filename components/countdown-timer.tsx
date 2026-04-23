"use client";
import { useState, useEffect } from "react";
import { differenceInSeconds } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

interface CountdownTimerProps {
  targetDate: string; // ISO string
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const target = new Date(targetDate);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, differenceInSeconds(target, new Date()))
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      const s = Math.max(0, differenceInSeconds(target, new Date()));
      setSecondsLeft(s);
    }, 1000);
    return () => clearInterval(interval);
  }, [target, secondsLeft]);

  if (secondsLeft <= 0) {
    return (
      <Card className="border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardContent className="py-4 text-center space-y-1">
          <p className="text-3xl">🎉</p>
          <p className="font-bold text-green-700 dark:text-green-300">It&apos;s holiday time!</p>
        </CardContent>
      </Card>
    );
  }

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const units = [
    { label: "days", value: days },
    { label: "hrs", value: hours },
    { label: "min", value: minutes },
    { label: "sec", value: seconds },
  ];

  return (
    <Card className="border-0 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 shadow-sm">
      <CardContent className="py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
          Countdown ✈️
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {units.map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <div className="bg-white dark:bg-slate-800 rounded-xl py-2 shadow-sm">
                <span className="text-xl font-extrabold tabular-nums text-blue-600 dark:text-blue-400">
                  {String(value).padStart(2, "0")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
