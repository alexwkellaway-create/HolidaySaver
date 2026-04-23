"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/lib/use-toast";

const REACTION_EMOJIS = ["👏", "🔥", "💪", "✈️"] as const;

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: { id: string; name: string | null };
  createdAt: string;
}

interface Contribution {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string | null; avatarEmoji: string };
  reactions: Reaction[];
}

interface ActivityFeedProps {
  contributions: Contribution[];
  currentUserId: string;
  isHost: boolean;
  partyId: string;
}

export function ActivityFeed({ contributions, currentUserId, isHost }: ActivityFeedProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // Optimistic reactions state (overlay on top of server data)
  const [reactionOverrides, setReactionOverrides] = useState<Record<string, Reaction[]>>({});

  function getReactions(c: Contribution): Reaction[] {
    return reactionOverrides[c.id] ?? c.reactions;
  }

  function startEdit(c: Contribution) {
    setEditingId(c.id);
    setEditAmount(String(c.amount));
    setEditNote(c.note ?? "");
  }

  async function saveEdit(id: string) {
    setLoadingIds((s) => new Set(s).add(id));
    const res = await fetch(`/api/contributions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(editAmount), note: editNote || null }),
    });
    setLoadingIds((s) => { const n = new Set(s); n.delete(id); return n; });

    if (!res.ok) {
      const d = await res.json();
      toast({ variant: "destructive", title: "Error", description: d.error });
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  async function deleteContribution(id: string, userName: string) {
    if (!confirm(`Delete ${userName}'s contribution?`)) return;
    setLoadingIds((s) => new Set(s).add(id));
    const res = await fetch(`/api/contributions/${id}`, { method: "DELETE" });
    setLoadingIds((s) => { const n = new Set(s); n.delete(id); return n; });

    if (!res.ok) { toast({ variant: "destructive", title: "Failed to delete" }); return; }
    router.refresh();
  }

  async function toggleReaction(contribution: Contribution, emoji: string) {
    // Optimistic update
    const current = getReactions(contribution);
    const existing = current.find((r) => r.userId === currentUserId && r.emoji === emoji);
    const optimistic = existing
      ? current.filter((r) => r.id !== existing.id)
      : [...current, { id: `temp-${Date.now()}`, emoji, userId: currentUserId, user: { id: currentUserId, name: null }, createdAt: new Date().toISOString() }];
    setReactionOverrides((o) => ({ ...o, [contribution.id]: optimistic }));

    await fetch(`/api/contributions/${contribution.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });

    // Clear optimistic override; let next refresh show real data
    router.refresh();
    setReactionOverrides((o) => { const n = { ...o }; delete n[contribution.id]; return n; });
  }

  if (contributions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-muted py-12 text-center text-muted-foreground">
        <div className="text-5xl mb-3">🏦</div>
        <p className="font-semibold">No contributions yet</p>
        <p className="text-sm mt-1">Be the first to drop some ✈️ money!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-bold text-lg">Recent Activity 📜</h2>
      {contributions.map((c) => {
        const canEdit = c.user.id === currentUserId || isHost;
        const reactions = getReactions(c);
        const isLoading = loadingIds.has(c.id);

        // Group reactions by emoji
        const grouped = REACTION_EMOJIS.map((emoji) => ({
          emoji,
          count: reactions.filter((r) => r.emoji === emoji).length,
          userReacted: reactions.some((r) => r.userId === currentUserId && r.emoji === emoji),
        })).filter((g) => g.count > 0 || true); // always show all 4

        return (
          <div
            key={c.id}
            className="rounded-2xl border bg-card p-4 space-y-3 animate-slide-in"
          >
            {/* Header row */}
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{c.user.avatarEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-bold">{c.user.name ?? "Someone"}</span>
                  <span className="text-muted-foreground text-xs">{timeAgo(c.createdAt)}</span>
                </div>

                {editingId === c.id ? (
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                      <Input
                        className="pl-6 h-8 text-sm"
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        min="0.01" max="50000" step="0.01"
                      />
                    </div>
                    <Input
                      className="h-8 text-sm"
                      placeholder="Note (optional)"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      maxLength={200}
                    />
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="sunset" className="h-7 px-2" onClick={() => saveEdit(c.id)} disabled={isLoading}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-xl font-extrabold text-orange-500">
                      {formatCurrency(c.amount)}
                    </span>
                    {c.note && (
                      <p className="text-sm text-muted-foreground mt-0.5 italic">&ldquo;{c.note}&rdquo;</p>
                    )}
                  </div>
                )}
              </div>

              {/* Edit/delete controls */}
              {canEdit && editingId !== c.id && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                    onClick={() => startEdit(c)} title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteContribution(c.id, c.user.name ?? "this")} title="Delete"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Reactions row */}
            <div className="flex gap-1.5 flex-wrap">
              {grouped.map(({ emoji, count, userReacted }) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(c, emoji)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all ${
                    userReacted
                      ? "bg-orange-50 border-orange-300 dark:bg-orange-950 dark:border-orange-700"
                      : "border-border hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/50"
                  }`}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span className="text-xs font-semibold text-muted-foreground">{count}</span>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
