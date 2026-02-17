import type { ChipConfig } from "@/app/session/new/page";

type Props = {
  chipSettings: ChipConfig;
  onUpdate: (patch: Partial<ChipConfig>) => void;
};

const CHIP_COUNTS = [20, 25, 30];
const CHIP_PRICES = [50, 100, 200, 500];

export function ChipSettings({ chipSettings, onUpdate }: Props) {
  return (
    <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
      <h3 className="mb-3 text-base font-bold text-gray-700">
        🎰 チップ設定
      </h3>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-600">
          スタート枚数（1人あたり）
        </label>
        <div className="flex gap-2">
          {CHIP_COUNTS.map((num) => (
            <button
              key={num}
              onClick={() => onUpdate({ startChips: num })}
              className={`flex-1 rounded-lg p-2 text-sm ${
                chipSettings.startChips === num
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {num}枚
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">
          1枚あたり
        </label>
        <div className="flex gap-2">
          {CHIP_PRICES.map((price) => (
            <button
              key={price}
              onClick={() => onUpdate({ pricePerChip: price })}
              className={`flex-1 rounded-lg p-2 text-sm ${
                chipSettings.pricePerChip === price
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {price}pt
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-gray-50 p-2 text-center text-sm text-gray-600">
        ※ 終了時に各自の最終枚数を入力して精算します
      </div>
    </div>
  );
}
