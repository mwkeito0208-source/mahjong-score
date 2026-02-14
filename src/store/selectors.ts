import type { Group, Session } from "@/lib/types";

export function getGroup(groups: Group[], id: string): Group | undefined {
  return groups.find((g) => g.id === id);
}

export function getSession(sessions: Session[], id: string): Session | undefined {
  return sessions.find((s) => s.id === id);
}

export function getGroupSessions(sessions: Session[], groupId: string): Session[] {
  return sessions
    .filter((s) => s.groupId === groupId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getMemberHistory(groups: Group[]): string[] {
  const names = new Set<string>();
  for (const group of groups) {
    for (const member of group.members) {
      names.add(member);
    }
  }
  return Array.from(names);
}

export function getGroupSummary(
  group: Group,
  sessions: Session[]
): { lastPlayed: string; totalSessions: number } {
  const groupSessions = getGroupSessions(sessions, group.id);
  if (groupSessions.length === 0) {
    return { lastPlayed: "-", totalSessions: 0 };
  }
  const lastDate = new Date(groupSessions[0].date);
  const lastPlayed = `${lastDate.getFullYear()}/${String(lastDate.getMonth() + 1).padStart(2, "0")}/${String(lastDate.getDate()).padStart(2, "0")}`;
  return { lastPlayed, totalSessions: groupSessions.length };
}
