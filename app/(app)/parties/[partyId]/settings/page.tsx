"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Trash2, UserX, RefreshCw, Crown } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/use-toast";
import { formatCurrency } from "@/lib/utils";

const COVER_EMOJIS = ["✈️", "🏖️", "🌴", "🍹", "🎉", "🌊", "⛷️", "🏔️", "🌅", "🗺️", "🎭", "🏛️"];

interface PartyDetails {
  id: string;
  name: string;
  destination: string;
  targetAmount: number;
  targetDate: string;
  coverEmoji: string;
  hostId: string;
  inviteToken: string;
  members: Array<{
    id: string;
    userId: string;
    personalTarget: number | null;
    user: { id: string; name: string | null; email: string; avatarEmoji: string };
  }>;
}

export default function PartySettingsPage() {
  const router = useRouter();
  const params = useParams();
  const partyId = params.partyId as string;
  const { toast } = useToast();

  const [party, setParty] = useState<PartyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", destination: "", targetAmount: "", targetDate: "", coverEmoji: "✈️" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/parties/${partyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.replace(`/parties/${partyId}`); return; }
        setParty(data);
        setForm({
          name: data.name,
          destination: data.destination,
          targetAmount: String(data.targetAmount),
          targetDate: data.targetDate.split("T")[0],
          coverEmoji: data.coverEmoji,
        });
        setLoading(false);
      });
  }, [partyId, router]);

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/parties/${partyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, targetAmount: Number(form.targetAmount) }),
    });
    const data = await res.json();
    if (!res.ok) { toast({ variant: "destructive", title: "Error", description: data.error }); }
    else { toast({ title: "Saved! ✅", description: "Party details updated." }); setParty(data); }
    setSaving(false);
  }

  async function handleRegenerateInvite() {
    if (!confirm("Regenerate invite link? The old link will stop working.")) return;
    const res = await fetch(`/api/parties/${partyId}/invite`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { toast({ variant: "destructive", title: "Error", description: data.error }); return; }
    setParty((p) => p ? { ...p, inviteToken: data.inviteToken } : p);
    toast({ title: "New invite link generated ✅" });
  }

  async function handleRemoveMember(memberId: string, userName: string) {
    if (!confirm(`Remove ${userName} from the party?`)) return;
    const res = await fetch(`/api/parties/${partyId}/members/${memberId}`, { method: "DELETE" });
    if (!res.ok) { toast({ variant: "destructive", title: "Failed to remove member" }); return; }
    setParty((p) => p ? { ...p, members: p.members.filter((m) => m.id !== memberId) } : p);
    toast({ title: `${userName} removed` });
  }

  async function handleTransferHost(userId: string, userName: string) {
    if (!confirm(`Transfer host role to ${userName}? You will no longer be the host.`)) return;
    const res = await fetch(`/api/parties/${partyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId: userId }),
    });
    if (!res.ok) { toast({ variant: "destructive", title: "Failed to transfer host role" }); return; }
    toast({ title: `${userName} is now the host 👑` });
    router.push(`/parties/${partyId}`);
  }

  async function handleDeleteParty() {
    const res = await fetch(`/api/parties/${partyId}`, { method: "DELETE" });
    if (!res.ok) { toast({ variant: "destructive", title: "Failed to delete party" }); return; }
    toast({ title: "Party deleted" });
    router.push("/dashboard");
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  if (!party) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/parties/${partyId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-extrabold">Party Settings ⚙️</h1>
      </div>

      {/* Edit details */}
      <Card className="shadow-lg border-0">
        <CardHeader><CardTitle>Edit Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Cover emoji</Label>
              <div className="flex flex-wrap gap-2">
                {COVER_EMOJIS.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => set("coverEmoji", emoji)}
                    className={`text-2xl p-2 rounded-xl border-2 transition-all ${form.coverEmoji === emoji ? "border-orange-500 bg-orange-50 dark:bg-orange-950 scale-110" : "border-transparent hover:border-orange-200"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Party name</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input id="destination" value={form.destination} onChange={(e) => set("destination", e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Total target (£)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
                <Input id="targetAmount" type="number" className="pl-7" value={form.targetAmount} onChange={(e) => set("targetAmount", e.target.value)} required min="1" max="1000000" step="0.01" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Holiday date</Label>
              <Input id="targetDate" type="date" value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} required />
            </div>
            <Button type="submit" variant="sunset" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members management */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Remove members or transfer the host role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {party.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2">
              <span className="text-2xl">{m.user.avatarEmoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{m.user.name ?? m.user.email}</p>
                {m.userId === party.hostId && <p className="text-xs text-orange-500 font-medium">Host 👑</p>}
              </div>
              {m.userId !== party.hostId && (
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" title="Transfer host role"
                    onClick={() => handleTransferHost(m.userId, m.user.name ?? m.user.email)}>
                    <Crown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" title="Remove member"
                    onClick={() => handleRemoveMember(m.id, m.user.name ?? m.user.email)}>
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invite link management */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Invite Link</CardTitle>
          <CardDescription>Regenerate the link if you think it&apos;s been shared too widely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-mono break-all">
            {typeof window !== "undefined" ? `${window.location.origin}/join/${party.inviteToken}` : `/join/${party.inviteToken}`}
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleRegenerateInvite}>
            <RefreshCw className="h-4 w-4" />
            Regenerate invite link
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="shadow-lg border-0 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Deleting the party cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          {!confirmDelete ? (
            <Button variant="destructive" className="w-full gap-2" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Delete this party
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Are you absolutely sure? All contributions and data will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={handleDeleteParty}>Yes, delete it</Button>
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
