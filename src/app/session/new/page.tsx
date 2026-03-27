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
        <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
          <div className="mb-4 flex items-center justify-between rounded-xl bg-green-900 p-3 text-white">
            <div className="text-lg font-bold">🀄 新しいセッション</div>
          </div>
          <p className="text-center text-gray-500">読み込み中...</p>
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
    (group?.members ?? []).length <= 5 ? (group?.members ?? []) : []
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

  const updateSettings = (patch: Partial<SessionSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const updateChipSettings = (patch: Partial<ChipConfig>) => {
    setChipSettings((prev) => ({ ...prev, ...patch }));
  };

  const canStart = selectedMembers.length >= 3 && selectedMembers.length <= 5;
  const isThreePlayer = selectedMembers.length === 3;
  const umaMap = isThreePlayer ? UMA_MAP_3 : UMA_MAP_4;

  const handleStart = () => {
    if (!canStart) return;

    // Update group members if new members were added
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

  // Combine member history with group members for the selector
  const allKnownMembers = Array.from(
    new Set([...memberHistory, ...(group?.members ?? [])])
  );

  if (!hydrated) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="mb-4 flex items-center justify-between rounded-xl bg-green-900 p-3 text-white">
          <div className="text-lg font-bold">🀄 新しいセッション</div>
        </div>
        <p className="text-center text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-green-900 p-3 text-white">
        <div className="text-lg font-bold">🀄 新しいセッション</div>
        <button
          onClick={() => router.push(groupId ? `/group/${groupId}` : "/")}
          className="rounded-lg bg-white/20 px-4 py-2 text-sm hover:bg-white/30"
        >
          ← 戻る
        </button>
      </div>

      {/* メンバー選択 */}
      <MemberSelector
        memberHistory={allKnownMembers}
        selectedMembers={selectedMembers}
        onToggle={toggleMember}
        onShowAdd={() => setShowAddMember(true)}
      />

      {/* ルール設定 */}
      <RuleSettings settings={settings} onUpdate={updateSettings} playerCount={selectedMembers.length} />

      {/* チップ詳細設定 */}
      {settings.chip && (
        <ChipSettings
          chipSettings={chipSettings}
          onUpdate={updateChipSettings}
        />
      )}

      {/* 設定サマリー */}
      <SettingsSummary settings={settings} chipSettings={chipSettings} />

      {/* 開始ボタン */}
      <button
        disabled={!canStart}
        onClick={handleStart}
        className={`w-full rounded-xl py-4 text-lg font-bold transition-all ${
          canStart
            ? "bg-green-600 text-white hover:bg-green-700"
            : "cursor-not-allowed bg-gray-300 text-gray-500"
        }`}
      >
        {canStart
          ? `🀄 ${selectedMembers.length}人で開始！`
          : `メンバーを${3 - selectedMembers.length > 0 ? `あと${3 - selectedMembers.length}人` : "3〜5人"}選択してください`}
      </button>

      {/* 新規メンバー追加モーダル */}
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
