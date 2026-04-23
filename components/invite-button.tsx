"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/lib/use-toast";

interface InviteButtonProps {
  partyId: string;
  inviteToken: string;
  isHost: boolean;
}

export function InviteButton({ partyId, inviteToken, isHost }: InviteButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [currentToken, setCurrentToken] = useState(inviteToken);
  const [regenerating, setRegenerating] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${currentToken}`
      : `/join/${currentToken}`;

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast({ title: "Invite link copied! 🔗", description: "Share it with your friends." });
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenerate() {
    if (!confirm("Regenerate invite link? The old link will stop working.")) return;
    setRegenerating(true);
    const res = await fetch(`/api/parties/${partyId}/invite`, { method: "POST" });
    const data = await res.json();
    setRegenerating(false);
    if (!res.ok) { toast({ variant: "destructive", title: "Failed to regenerate" }); return; }
    setCurrentToken(data.inviteToken);
    toast({ title: "New link generated ✅" });
  }

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Invite friends 🔗</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono text-muted-foreground overflow-hidden">
          <span className="truncate flex-1">{inviteUrl}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="sunset" size="sm" className="flex-1 gap-1.5" onClick={copyLink}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy link"}
          </Button>
          {isHost && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={regenerate} disabled={regenerating}>
              <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Anyone with this link can join the party directly.
        </p>
      </CardContent>
    </Card>
  );
}
