"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import { RuleSettings } from "@/components/session/RuleSettings";
import { ChipSettings } from "@/components/session/ChipSettings";
import {
  toSettingsForm,
  toChipConfigForm,
  fromSettingsForm,
  fromChipConfigForm,
  type SessionSettingsForm,
  type ChipConfigForm,
} from "@/lib/session-settings";
import type { Session, SessionSettings, ChipConfig } from "@/lib/types";

type Props = {
  session: Session;
  onSave: (settings: SessionSettings, chipConfig: ChipConfig) => void;
  onClose: () => void;
};

export function EditSessionSettingsModal({ session, onSave, onClose }: Props) {
  const playerCount = session.members.length;

  const [settings, setSettings] = useState<SessionSettingsForm>(() => ({
    ...toSettingsForm(session.settings, playerCount),
    chip: session.chipConfig.enabled,
  }));
  const [chipSettings, setChipSettings] = useState<ChipConfigForm>(() =>
    toChipConfigForm(session.chipConfig),
  );

  const handleSave = () => {
    const newSettings = fromSettingsForm(settings, playerCount, session.settings.tobiPenalty);
    const newChipConfig = fromChipConfigForm(chipSettings, settings.chip);
    onSave(newSettings, newChipConfig);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="設定を修正"
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="md" fullWidth onClick={onClose}>
            やめる
          </Button>
          <Button variant="primary" size="md" fullWidth onClick={handleSave}>
            保存する
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-[var(--ink-subtle)]">
          記録済みの半荘があっても、収支は新しい設定で再計算されます。
        </p>

        <RuleSettings
          settings={settings}
          onUpdate={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          playerCount={playerCount}
        />

        {settings.chip && (
          <ChipSettings
            chipSettings={chipSettings}
            onUpdate={(patch) => setChipSettings((prev) => ({ ...prev, ...patch }))}
          />
        )}
      </div>
    </Modal>
  );
}
