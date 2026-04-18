"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MemberSelector } from "@/components/session/MemberSelector";
import { RuleSettings } from "@/components/session/RuleSettings";
import { ChipSettings } from "@/components/session/ChipSettings";
import { SettingsSummary } from "@/components/session/SettingsSummary";
import { AddMemberModal } from "@/components/session/AddMemberModal";
import { useAppStore } from "@/store";
import { getGroup, getMemberHistory } from "@/store/selectors";
import { useHydration } from "@/store/useHydration";
import { Button } from "@/components/ui";

export type SessionSettings = {
  rate: string;
  uma: string;
  startPoints: string;
  returnPoints: string;
  tobi: boolean;
  chip: boolean;
};

export type ChipConfig = {
  startChips: number;
  pricePerChip: number;
};

const RATE_MAP: Record<string, number> = {
  norate: 0,
  tengo: 50,
  tenpin: 100,
  ten2: 200,
  ten5: 500,
};

const UMA_MAP_4: Record<string, number[]> = {
  none: [0, 0, 0, 0],
  "5-10": [10, 5, -5, -10],
  "10-20": [20, 10, -10, -20],
  "10-30": [30, 10, -10, -30],
  "20-30": [30, 20, -20, -30],
};

const UMA_MAP_3: Record<string, number[]> = {
  none: [0, 0, 0],
  "5-10": [10, 0, -10],
  "10-20": [20, 0, -20],
  "10-30": [30, 0, -30],
  "20-30": [30, -10, -20],
};

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-6">
          <p className="text-sm text-[var(--ink-muted)]">読み込み中…</p>
        </div>
      }
    >
      <NewSessionContent />
    </Suspense>
  );
}

function NewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydration();
  const groupId = searchParams.get("groupId") ?? "";

  const groups = useAppStore((s) => s.groups);
  const createSession = useAppStore((s) => s.createSession);
  const updateGroup = useAppStore((s) => s.updateGroup);

  const group = getGroup(groups, groupId);
  const memberHistory = getMemberHistory(groups);

  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    (group?.members ?? []).length <= 5 ? (group?.members ?? []) : [],
  );
  const [showAddMember, setShowAddMember] = useState(false);

  const [settings, setSettings] = useState<SessionSettings>({
    rate: "tenpin",
    uma: "10-30",
    startPoints: "25000",
    returnPoints: "30000",
    tobi: true,
    chip: false,
  });

  const [chipSettings, setChipSettings] = useState<ChipConfig>({
    startChips: 25,
    pricePerChip: 100,
  });

  const toggleMember = (name: string) => {
    if (selectedMembers.includes(name)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== name));
    } else if (selectedMembers.length < 5) {
      setSelectedMembers([...selectedMembers, name]);
    }
  };

  const handleAddNewMember = (name: string) => {
    if (!selectedMembers.includes(name) && selectedMembers.length < 5) {
      setSelectedMembers([...selectedMembers, name]);
    }
    setShowAddMember(false);
  };

  const canStart = selectedMembers.length >= 3 && selectedMembers.length <= 5;
  const isThreePlayer = selectedMembers.length === 3;
  const umaMap = isThreePlayer ? UMA_MAP_3 : UMA_MAP_4;

  const handleStart = () => {
    if (!canStart) return;
    if (group) {
      const allMembers = new Set([...group.members, ...selectedMembers]);
      if (allMembers.size > group.members.length) {
        updateGroup(group.id, { members: Array.from(allMembers) });
      }
    }
    const session = createSession({
      groupId,
      members: selectedMembers,
      settings: {
        rate: RATE_MAP[settings.rate] ?? 100,
        uma: umaMap[settings.uma] ?? (isThreePlayer ? [30, 0, -30] : [30, 10, -10, -30]),
        startPoints: parseInt(settings.startPoints) / 1000,
        returnPoints: parseInt(settings.returnPoints) / 1000,
        tobi: settings.tobi,
        tobiPenalty: 10,
      },
      chipConfig: {
        enabled: settings.chip,
        startChips: chipSettings.startChips,
        pricePerChip: chipSettings.pricePerChip,
      },
    });
    router.push(`/session/${session.id}/score`);
  };

  const allKnownMembers = Array.from(
    new Set([...memberHistory, ...(group?.members ?? [])]),
  );

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-sm text-[var(--ink-muted)]">読み込み中…</p>
      </div>
    );
  }

  const needMore = Math.max(0, 3 - selectedMembers.length);

  return (
    <div className="min-h-dvh pb-32">
      {/* 集中モード用の簡潔ヘッダー（AppShellは非表示） */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push(groupId ? `/group/${groupId}` : "/")}
            className="inline-flex items-center gap-1 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            ← 戻る
          </button>
          <div className="font-serif-jp text-sm font-bold tracking-widest text-[var(--ink)]">
            卓を設える
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {group && (
          <div>
            <p className="text-[11px] tracking-[0.3em] text-[var(--ink-subtle)]">GROUP</p>
            <h1 className="mt-0.5 font-serif-jp text-2xl font-bold tracking-wider text-[var(--ink)]">
              {group.name}
            </h1>
          </div>
        )}

        <MemberSelector
          memberHistory={allKnownMembers}
          selectedMembers={selectedMembers}
          onToggle={toggleMember}
          onShowAdd={() => setShowAddMember(true)}
        />

        <RuleSettings
          settings={settings}
          onUpdate={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          playerCount={selectedMembers.length}
        />

        {settings.chip && (
          <ChipSettings
            chipSettings={chipSettings}
            onUpdate={(patch) => setChipSettings((prev) => ({ ...prev, ...patch }))}
          />
        )}

        <SettingsSummary settings={settings} chipSettings={chipSettings} />
      </div>

      {/* 固定フッター：開始CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_95%,transparent)] backdrop-blur pb-safe">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canStart}
            onClick={handleStart}
          >
            {canStart
              ? `${selectedMembers.length}人で始める →`
              : needMore > 0
                ? `あと${needMore}人 選んでください`
                : "人数は3〜5人で"}
          </Button>
        </div>
      </div>

      {showAddMember && (
        <AddMemberModal
          existingMembers={[...allKnownMembers, ...selectedMembers]}
          onAdd={handleAddNewMember}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
}
