"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { SessionCardNew, type SessionSummary } from "@/components/group/SessionCardNew";
import { SessionDetailModalNew } from "@/components/group/SessionDetailModalNew";
import { useAppStore } from "@/store";
import { getGroup, getGroupSessions } from "@/store/selectors";
import { useHydration } from "@/store/useHydration";
import { useSyncGroup } from "@/store/useSyncGroup";
import {
  calculateTotals,
  calculateMoney,
  type RoundData,
} from "@/lib/score";
import { Button, LinkButton, Card, Modal, Input, RankBadge, Badge } from "@/components/ui";

const RATE_LABELS: Record<number, string> = {
  0: "ノーレート",
  50: "テンゴ",
  100: "テンピン",
  200: "点2",
  500: "点5",
};

function formatUma(uma: number[]): string {
  if (uma.every((v) => v === 0)) return "ナシ";
  return `${Math.abs(uma[1])}-${Math.abs(uma[0])}`;
}

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const hydrated = useHydration();
  useSyncGroup(groupId);

  const groups = useAppStore((s) => s.groups);
  const sessions = useAppStore((s) => s.sessions);
  const deleteSession = useAppStore((s) => s.deleteSession);
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const renameMember = useAppStore((s) => s.renameMember);

  const group = getGroup(groups, groupId);
  const groupSessions = useMemo(
    () => getGroupSessions(sessions, groupId),
    [sessions, groupId],
  );

  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [renamingMember, setRenamingMember] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState("");

  const sessionSummaries: SessionSummary[] = useMemo(() => {
    return groupSessions.map((ses) => {
      const roundDataList: RoundData[] = ses.rounds.map((r) => ({
        scores: r.scores,
        tobi: r.tobi,
      }));
      const totals =
        roundDataList.length > 0
          ? calculateTotals(
              roundDataList,
              ses.settings.returnPoints,
              ses.settings.uma,
              ses.settings.tobiPenalty,
              ses.settings.startPoints,
            )
          : ses.members.map(() => 0);
      const money = calculateMoney(totals, ses.settings.rate);

      const results = ses.members
        .map((name, i) => ({ name, score: totals[i], money: money[i] }))
        .sort((a, b) => b.score - a.score);

      const d = new Date(ses.date);
      const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
      const rateLabel = RATE_LABELS[ses.settings.rate] ?? `${ses.settings.rate}pt`;
      const umaLabel = formatUma(ses.settings.uma);

      return {
        id: ses.id as unknown as number,
        date: dateStr,
        members: ses.members,
        rounds: ses.rounds.length,
        results,
        settings: `${rateLabel} / ${umaLabel}`,
      };
    });
  }, [groupSessions]);

  const ranking = useMemo(() => {
    const pointsMap = new Map<string, number>();
    const roundsMap = new Map<string, number>();
    for (const ses of groupSessions) {
      const roundDataList: RoundData[] = ses.rounds.map((r) => ({
        scores: r.scores,
        tobi: r.tobi,
      }));
      if (roundDataList.length === 0) continue;
      const totals = calculateTotals(
        roundDataList,
        ses.settings.returnPoints,
        ses.settings.uma,
        ses.settings.tobiPenalty,
        ses.settings.startPoints,
      );
      ses.members.forEach((name, i) => {
        pointsMap.set(name, (pointsMap.get(name) ?? 0) + totals[i]);
        roundsMap.set(name, (roundsMap.get(name) ?? 0) + ses.rounds.length);
      });
    }
    return [...pointsMap.entries()]
      .map(([name, pts]) => ({ name, pts, rounds: roundsMap.get(name) ?? 0 }))
      .sort((a, b) => b.pts - a.pts);
  }, [groupSessions]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 lg:py-10">
        <p className="text-sm text-[var(--ink-muted)]">読み込み中…</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card padding="lg" className="text-center">
          <p className="text-[var(--ink-muted)]">組が見つかりません</p>
          <Button variant="primary" size="md" className="mt-4" onClick={() => router.push("/")}>
            席に戻る
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:py-10">
      {/* ページヘッダー */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            onClick={() => router.back()}
            className="mb-2 inline-flex items-center gap-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            ← 戻る
          </button>
          <h1 className="font-serif-jp text-3xl font-bold tracking-wider text-[var(--ink)]">
            {group.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {group.members.length}人のメンバー・{groupSessions.length}対局
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label="この組を削除"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
          </svg>
        </Button>
      </div>

      {/* 新しい対局へ */}
      <LinkButton
        href={`/session/new?groupId=${group.id}`}
        variant="primary"
        size="lg"
        fullWidth
        className="mt-5"
      >
        半荘を始める →
      </LinkButton>

      {/* 番付（ランキング） */}
      <section className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-serif-jp text-xl font-bold tracking-wider text-[var(--ink)]">番付</h2>
            <p className="mt-0.5 text-xs text-[var(--ink-subtle)]">累計素点の高い順・名前をタップで変更</p>
          </div>
        </div>

        {ranking.length > 0 ? (
          <Card padding="none" className="mt-3 overflow-hidden">
            <div className="grid grid-cols-[3rem_1fr_5rem_4rem_3rem] items-center gap-2 border-b border-[var(--line)] px-3 py-2 text-[11px] tracking-widest text-[var(--ink-subtle)]">
              <span className="text-center">位</span>
              <span>名前</span>
              <span className="text-right">素点</span>
              <span className="text-right">差</span>
              <span className="text-right">半荘</span>
            </div>
            {ranking.map((r, i) => {
              const diff = i === 0 ? 0 : r.pts - ranking[i - 1].pts;
              const rank = (Math.min(i + 1, 4) as 1 | 2 | 3 | 4);
              return (
                <button
                  key={r.name}
                  onClick={() => { setRenamingMember(r.name); setNewMemberName(r.name); }}
                  className="grid w-full grid-cols-[3rem_1fr_5rem_4rem_3rem] items-center gap-2 border-b border-[var(--line)] px-3 py-2.5 text-left last:border-b-0 hover:bg-[var(--surface-2)]"
                >
                  <span className="flex justify-center">
                    {i < 4 ? <RankBadge rank={rank} /> : (
                      <span className="inline-flex h-6 w-6 items-center justify-center text-xs text-[var(--ink-subtle)]">
                        {i + 1}
                      </span>
                    )}
                  </span>
                  <span className="truncate text-sm font-medium text-[var(--ink)]">{r.name}</span>
                  <span className={`num-mono tabular text-right text-sm font-bold ${
                    r.pts > 0 ? "text-[var(--positive)]" : r.pts < 0 ? "text-[var(--negative)]" : "text-[var(--ink-muted)]"
                  }`}>
                    {r.pts > 0 ? "+" : ""}{r.pts.toFixed(1)}
                  </span>
                  <span className="num-mono tabular text-right text-xs text-[var(--ink-subtle)]">
                    {i === 0 ? "—" : diff.toFixed(1)}
                  </span>
                  <span className="num-mono tabular text-right text-xs text-[var(--ink-muted)]">
                    {r.rounds}
                  </span>
                </button>
              );
            })}
          </Card>
        ) : (
          <Card padding="lg" className="mt-3 text-center">
            <p className="text-sm text-[var(--ink-muted)]">対局を記録すると番付が表示されます</p>
          </Card>
        )}
      </section>

      {/* 対局履歴 */}
      <section className="mt-8">
        <h2 className="font-serif-jp text-xl font-bold tracking-wider text-[var(--ink)]">
          対局履歴
        </h2>
        <div className="mt-3 space-y-3">
          {sessionSummaries.length > 0 ? (
            sessionSummaries.map((s) => (
              <SessionCardNew
                key={s.id}
                session={s}
                onClick={() => setSelectedSession(s)}
                onDelete={(id) => deleteSession(String(id))}
              />
            ))
          ) : (
            <Card padding="lg" className="text-center">
              <p className="text-sm text-[var(--ink-muted)]">まだ対局がありません</p>
              <p className="mt-1 text-xs text-[var(--ink-subtle)]">最初の半荘を始めましょう</p>
            </Card>
          )}
        </div>
      </section>

      {/* モーダル：メンバー名変更 */}
      <Modal
        open={!!renamingMember}
        onClose={() => setRenamingMember(null)}
        title="名前を変更"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" fullWidth onClick={() => setRenamingMember(null)}>
              キャンセル
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                if (renamingMember && newMemberName.trim() && newMemberName !== renamingMember) {
                  renameMember(groupId, renamingMember, newMemberName.trim());
                  setRenamingMember(null);
                }
              }}
              disabled={!newMemberName.trim() || newMemberName === renamingMember}
            >
              変更する
            </Button>
          </div>
        }
      >
        {renamingMember && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--ink-muted)]">
              「<span className="font-medium text-[var(--ink)]">{renamingMember}</span>」の新しい名前
            </p>
            <Input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              autoFocus
            />
            {newMemberName && newMemberName !== renamingMember && group.members.includes(newMemberName) && (
              <p className="text-xs text-[color:var(--gold)]">
                <Badge tone="gold" size="sm">統合</Badge>{" "}
                「{newMemberName}」は既に存在するため、2人分のデータは統合されます。
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* モーダル：グループ削除確認 */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="この組を削除"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" fullWidth onClick={() => setShowDeleteConfirm(false)}>
              やめる
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={() => {
                deleteGroup(groupId);
                router.push("/");
              }}
            >
              削除する
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--ink)]">
          「<span className="font-bold">{group.name}</span>」を削除しますか？
        </p>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          関連する{groupSessions.length}件の対局記録も全て削除されます。この操作は元に戻せません。
        </p>
      </Modal>

      {/* モーダル：セッション詳細 */}
      {selectedSession && (
        <SessionDetailModalNew
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
