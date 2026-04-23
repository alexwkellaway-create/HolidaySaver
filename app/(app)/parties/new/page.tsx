"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/use-toast";

const COVER_EMOJIS = ["✈️", "🏖️", "🌴", "🍹", "🎉", "🌊", "⛷️", "🏔️", "🌅", "🗺️", "🎭", "🏛️"];

export default function NewPartyPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    destination: "",
    targetAmount: "",
    targetDate: "",
    coverEmoji: "✈️",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        targetAmount: Number(form.targetAmount),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: data.error ?? "Failed to create party" });
      setLoading(false);
      return;
    }

    toast({ variant: "success" as "default", title: "Party created! 🎉", description: `${form.name} is ready to go.` });
    router.push(`/parties/${data.id}`);
  }

  // Minimum target date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-extrabold">Create a new pot 🏖️</h1>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Tell us about the holiday</CardTitle>
          <CardDescription>You can edit these details later.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Emoji picker */}
            <div className="space-y-2">
              <Label>Cover emoji</Label>
              <div className="flex flex-wrap gap-2">
                {COVER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => set("coverEmoji", emoji)}
                    className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                      form.coverEmoji === emoji
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950 scale-110"
                        : "border-transparent hover:border-orange-200"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Party name */}
            <div className="space-y-2">
              <Label htmlFor="name">Party name</Label>
              <Input
                id="name"
                placeholder="Ibiza 2026 🌴"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                maxLength={80}
              />
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="Ibiza, Spain"
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                required
                maxLength={100}
              />
            </div>

            {/* Target amount */}
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Total target (£)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="3000"
                  className="pl-7"
                  value={form.targetAmount}
                  onChange={(e) => set("targetAmount", e.target.value)}
                  required
                  min="1"
                  max="1000000"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Can be split evenly across members, or you can set personal targets later.
              </p>
            </div>

            {/* Target date */}
            <div className="space-y-2">
              <Label htmlFor="targetDate">Holiday date</Label>
              <Input
                id="targetDate"
                type="date"
                value={form.targetDate}
                onChange={(e) => set("targetDate", e.target.value)}
                required
                min={minDate}
              />
            </div>

            <Button type="submit" variant="sunset" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create pot & get invite link 🎉"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
