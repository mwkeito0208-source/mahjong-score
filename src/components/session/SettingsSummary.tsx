import type { SessionSettings, ChipConfig } from "@/app/session/new/page";

type Props = {
  settings: SessionSettings;
  chipSettings: ChipConfig;
};

const RATE_LABELS: Record<string, string> = {
  norate: "ノーレート",
  tengo: "テンゴ",
  tenpin: "テンピン",
  ten2: "点2",
  ten5: "点5",
};

const UMA_LABELS: Record<string, string> = {
  none: "ナシ",
  "5-10": "5-10",
  "10-20": "10-20",
  "10-30": "10-30",
  "20-30": "20-30",
};

export function SettingsSummary({ settings, chipSettings }: Props) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--bg-subtle)] p-4">
      <div className="text-[11px] tracking-widest text-[var(--ink-subtle)]">設定サマリー</div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-[var(--ink)]">
        <Row k="レート" v={RATE_LABELS[settings.rate]} />
        <Row k="ウマ" v={UMA_LABELS[settings.uma]} />
        <Row k="持ち点" v={`${Number(settings.startPoints).toLocaleString()}点`} />
        <Row k="返し点" v={`${Number(settings.returnPoints).toLocaleString()}点`} />
        <Row k="飛び賞" v={settings.tobi ? "あり (±10)" : "なし"} />
        {settings.chip && (
          <Row
            k="チップ"
            v={`${chipSettings.startChips}枚 × ${chipSettings.pricePerChip}pt`}
          />
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-[var(--ink-muted)]">{k}</span>
      <span className="num-mono text-sm font-medium text-[var(--ink)]">{v}</span>
    </div>
  );
}
