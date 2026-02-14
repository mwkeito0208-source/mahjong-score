import type { SessionSettings } from "@/app/session/new/page";

type Props = {
  settings: SessionSettings;
  onUpdate: (patch: Partial<SessionSettings>) => void;
};

const RATE_OPTIONS = [
  { value: "norate", label: "ノーレート" },
  { value: "tengo", label: "テンゴ (1000点=50円)" },
  { value: "tenpin", label: "テンピン (1000点=100円)" },
  { value: "ten2", label: "点2 (1000点=200円)" },
  { value: "ten5", label: "点5 (1000点=500円)" },
];

const UMA_OPTIONS = [
  { value: "none", label: "ナシ" },
  { value: "5-10", label: "5-10 (ゴットー)" },
  { value: "10-20", label: "10-20 (ワンツー)" },
  { value: "10-30", label: "10-30 (ワンスリー)" },
  { value: "20-30", label: "20-30 (ツースリー)" },
];

const POINT_OPTIONS = [
  { value: "25000", label: "25,000点" },
  { value: "30000", label: "30,000点" },
];

const RETURN_OPTIONS = [
  { value: "30000", label: "30,000点" },
  { value: "40000", label: "40,000点" },
];

export function RuleSettings({ settings, onUpdate }: Props) {
  return (
    <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
      <h3 className="mb-3 text-base font-bold text-gray-700">⚙️ ルール設定</h3>

      {/* レート */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-600">
          レート
        </label>
        <div className="grid grid-cols-2 gap-2">
          {RATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ rate: option.value })}
              className={`rounded-lg p-2 text-sm transition-all ${
                settings.rate === option.value
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* ウマ */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-600">
          ウマ
        </label>
        <div className="grid grid-cols-2 gap-2">
          {UMA_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ uma: option.value })}
              className={`rounded-lg p-2 text-sm transition-all ${
                settings.uma === option.value
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 持ち点・返し */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-600">
            持ち点
          </label>
          <select
            value={settings.startPoints}
            onChange={(e) => onUpdate({ startPoints: e.target.value })}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
          >
            {POINT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-600">
            返し
          </label>
          <select
            value={settings.returnPoints}
            onChange={(e) => onUpdate({ returnPoints: e.target.value })}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
          >
            {RETURN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 飛び賞・チップ */}
      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => onUpdate({ tobi: !settings.tobi })}
          className={`cursor-pointer rounded-lg p-3 transition-all ${
            settings.tobi
              ? "border-2 border-green-500 bg-green-100"
              : "border-2 border-transparent bg-gray-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">飛び賞</span>
            <span
              className={`text-lg ${settings.tobi ? "text-green-600" : "text-gray-400"}`}
            >
              {settings.tobi ? "✓" : "○"}
            </span>
          </div>
          <span className="text-xs text-gray-500">±10</span>
        </div>
        <div
          onClick={() => onUpdate({ chip: !settings.chip })}
          className={`cursor-pointer rounded-lg p-3 transition-all ${
            settings.chip
              ? "border-2 border-green-500 bg-green-100"
              : "border-2 border-transparent bg-gray-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">チップ</span>
            <span
              className={`text-lg ${settings.chip ? "text-green-600" : "text-gray-400"}`}
            >
              {settings.chip ? "✓" : "○"}
            </span>
          </div>
          <span className="text-xs text-gray-500">赤・一発・裏</span>
        </div>
      </div>
    </div>
  );
}
