"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle } from "lucide-react";
import { useToast } from "@/lib/use-toast";

const QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];
const NOTE_SUGGESTIONS = [
  "Payday treat 🎉",
  "Side hustle money 💸",
  "Birthday money 🎂",
  "Saved from lunches 🥗",
  "Sold some stuff 📦",
  "Bonus! 🔥",
];

interface ContributionFormProps {
  partyId: string;
}

export function ContributionForm({ partyId }: ContributionFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/parties/${partyId}/contributions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), note: note || undefined }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: data.error ?? "Failed to add contribution" });
      setLoading(false);
      return;
    }

    toast({
      title: "Contribution added! 🎉",
      description: `£${Number(amount).toFixed(2)} added to the pot.`,
    });

    setAmount("");
    setNote("");
    setOpen(false);
    setLoading(false);
    router.refresh(); // Re-fetch server component data
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-orange-200 dark:border-orange-900 hover:border-orange-400 dark:hover:border-orange-700 transition-colors py-5 text-center group"
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-orange-500 transition-colors">
          <PlusCircle className="h-8 w-8" />
          <span className="font-semibold">Add a contribution ✈️</span>
          <span className="text-xs">Log money you&apos;ve set aside for the holiday</span>
        </div>
      </button>
    );
  }

  return (
    <Card className="shadow-lg border-0 animate-slide-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Add a contribution 💰</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick amount buttons */}
          <div className="space-y-2">
            <Label>Quick amounts</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    amount === String(q)
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-600"
                      : "border-border hover:border-orange-300"
                  }`}
                >
                  £{q}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Or enter custom amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                className="pl-7"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
                max="50000"
                step="0.01"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="e.g. Payday treat 🎉"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={2}
            />
            {/* Note suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {NOTE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNote(s)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-orange-100 dark:hover:bg-orange-950 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="sunset" className="flex-1" disabled={loading || !amount}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to pot 🎉"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
