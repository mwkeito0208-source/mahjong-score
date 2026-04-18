import type { ChipConfig } from "@/app/session/new/page";
import { Card } from "@/components/ui";

type Props = {
  chipSettings: ChipConfig;
  onUpdate: (patch: Partial<ChipConfig>) => void;
};

const CHIP_COUNTS = [20, 25, 30];
const CHIP_PRICES = [50, 100, 200, 500];

export function ChipSettings({ chipSettings, onUpdate }: Props) {
  return (
    <Card padding="md">
      <h3 className="font-serif-jp text-base font-bold text-[var(--ink)]">チップ</h3>
      <p className="mt-0.5 text-xs text-[var(--ink-subtle)]">
        終了時に各自の枚数を入力して精算します
      </p>

      <div className="mt-4">
        <div className="mb-2 text-[11px] tracking-widest text-[var(--ink-subtle)]">スタート枚数（1人あたり）</div>
        <div className="flex gap-2">
          {CHIP_COUNTS.map((num) => {
            const active = chipSettings.startChips === num;
            return (
              <button
                key={num}
                onClick={() => onUpdate({ startChips: num })}
                className={`flex-1 rounded-[var(--radius-md)] border py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--surface)]"
                    : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--ink-subtle)]"
                }`}
              >
                {num}枚
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-[11px] tracking-widest text-[var(--ink-subtle)]">1枚あたり</div>
        <div className="flex gap-2">
          {CHIP_PRICES.map((price) => {
            const active = chipSettings.pricePerChip === price;
            return (
              <button
                key={price}
                onClick={() => onUpdate({ pricePerChip: price })}
                className={`flex-1 rounded-[var(--radius-md)] border py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--surface)]"
                    : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--ink-subtle)]"
                }`}
              >
                <span className="num-mono">{price}</span>
                <span className="text-[10px] text-[var(--ink-subtle)]"> pt</span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
