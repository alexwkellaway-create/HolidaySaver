import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Member {
  id: string;
  userId: string;
  joinedAt: string;
  user: { id: string; name: string | null; email: string; avatarEmoji: string };
}

interface MembersListProps {
  members: Member[];
  hostId: string;
  currentUserId: string;
}

export function MembersList({ members, hostId, currentUserId }: MembersListProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3">
            <span className="text-xl">{m.user.avatarEmoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {m.user.name ?? m.user.email}
                {m.userId === currentUserId && <span className="text-muted-foreground text-xs ml-1">(you)</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                Joined {format(new Date(m.joinedAt), "d MMM yyyy")}
              </p>
            </div>
            {m.userId === hostId && (
              <Badge variant="sunset" className="text-xs">Host 👑</Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
