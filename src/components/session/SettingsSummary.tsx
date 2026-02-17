import type { SessionSettings, ChipConfig } from "@/app/session/new/page";

type Props = {
  settings: SessionSettings;
  chipSettings: ChipConfig;
};

const RATE_LABELS: Record<string, string> = {
  norate: "ノーレート",
  tengo: "テンゴ (1000点=50pt)",
  tenpin: "テンピン (1000点=100pt)",
  ten2: "点2 (1000点=200pt)",
  ten5: "点5 (1000点=500pt)",
};

const UMA_LABELS: Record<string, string> = {
  none: "ナシ",
  "5-10": "5-10 (ゴットー)",
  "10-20": "10-20 (ワンツー)",
  "10-30": "10-30 (ワンスリー)",
  "20-30": "20-30 (ツースリー)",
};

export function SettingsSummary({ settings, chipSettings }: Props) {
  return (
    <div className="mb-4 rounded-xl bg-green-50 p-4">
      <h4 className="mb-2 text-sm font-bold text-green-800">
        📋 設定サマリー
      </h4>
      <div className="space-y-1 text-sm text-green-700">
        <div>レート: {RATE_LABELS[settings.rate]}</div>
        <div>ウマ: {UMA_LABELS[settings.uma]}</div>
        <div>
          持ち点: {Number(settings.startPoints).toLocaleString()}点 / 返し:{" "}
          {Number(settings.returnPoints).toLocaleString()}点
        </div>
        <div>飛び賞: {settings.tobi ? "あり (±10)" : "なし"}</div>
        {settings.chip && (
          <div>
            チップ: {chipSettings.startChips}枚スタート /{" "}
            {chipSettings.pricePerChip}pt/枚
          </div>
        )}
      </div>
    </div>
  );
}
