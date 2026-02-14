"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Group } from "@/lib/types";

type Props = {
  group: Group;
  lastPlayed: string;
  totalSessions: number;
  onInvite: (group: Group) => void;
};

export function GroupCard({ group, lastPlayed, totalSessions, onInvite }: Props) {
  const router = useRouter();

  const memberText =
    group.members.length > 0
      ? group.members.slice(0, 3).join(", ") +
        (group.members.length > 3
          ? ` 他${group.members.length - 3}人`
          : "")
      : "メンバーなし";

  return (
    <div
      onClick={() => router.push(`/group/${group.id}`)}
      className="cursor-pointer rounded-xl bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{group.name}</h3>
          <p className="text-sm text-gray-500">{memberText}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInvite(group);
          }}
          className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600"
        >
          🔗
        </button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-500">
          <span>最終: {lastPlayed}</span>
          <span className="mx-2">•</span>
          <span>{totalSessions}回</span>
        </div>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3">
        <Link
          href={`/session/new?groupId=${group.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block w-full rounded-lg bg-green-50 py-2 text-center text-sm font-medium text-green-700 hover:bg-green-100"
        >
          🎮 セッションを開始
        </Link>
      </div>
    </div>
  );
}
