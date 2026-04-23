/**
 * Shared TypeScript types used across the app.
 * Augments next-auth's Session to include our custom fields.
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      avatarEmoji: string;
    } & DefaultSession["user"];
  }
}

// ── API response shapes ─────────────────────────────────────────────────────

export interface PartyWithDetails {
  id: string;
  name: string;
  destination: string;
  targetAmount: number;
  targetDate: string; // ISO string
  coverEmoji: string;
  coverPhoto: string | null;
  inviteToken: string;
  createdAt: string;
  host: {
    id: string;
    name: string | null;
    avatarEmoji: string;
  };
  members: MemberWithUser[];
  contributions: ContributionWithUser[];
  totalRaised: number;
  percentComplete: number;
}

export interface MemberWithUser {
  id: string;
  personalTarget: number | null;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarEmoji: string;
  };
  totalContributed: number;
}

export interface ContributionWithUser {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatarEmoji: string;
  };
  reactions: ReactionSummary[];
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  userReacted: boolean; // Has the current user added this emoji?
}
