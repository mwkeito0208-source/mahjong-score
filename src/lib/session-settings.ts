import type { SessionSettings as StoredSettings, ChipConfig as StoredChipConfig } from "@/lib/types";

/** 新規作成・編集フォームで扱うUI用の設定（文字列キー） */
export type SessionSettingsForm = {
  rate: string;
  uma: string;
  startPoints: string;
  returnPoints: string;
  tobi: boolean;
  chip: boolean;
};

export type ChipConfigForm = {
  startChips: number;
  pricePerChip: number;
};

export const RATE_MAP: Record<string, number> = {
  norate: 0,
  tengo: 50,
  tenpin: 100,
  ten2: 200,
  ten5: 500,
};

export const UMA_MAP_4: Record<string, number[]> = {
  none: [0, 0, 0, 0],
  "5-10": [10, 5, -5, -10],
  "10-20": [20, 10, -10, -20],
  "10-30": [30, 10, -10, -30],
  "20-30": [30, 20, -20, -30],
};

export const UMA_MAP_3: Record<string, number[]> = {
  none: [0, 0, 0],
  "5-10": [10, 0, -10],
  "10-20": [20, 0, -20],
  "10-30": [30, 0, -30],
  "20-30": [30, -10, -20],
};

function findKeyByValue<T>(map: Record<string, T>, value: T, equals: (a: T, b: T) => boolean): string | undefined {
  return Object.keys(map).find((k) => equals(map[k], value));
}

const arraysEqual = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/** 保存済みSessionSettingsをフォーム用（文字列キー）に変換 */
export function toSettingsForm(settings: StoredSettings, playerCount: number): SessionSettingsForm {
  const umaMap = playerCount === 3 ? UMA_MAP_3 : UMA_MAP_4;
  return {
    rate: findKeyByValue(RATE_MAP, settings.rate, (a, b) => a === b) ?? "tenpin",
    uma: findKeyByValue(umaMap, settings.uma, arraysEqual) ?? "10-30",
    startPoints: String(Math.round(settings.startPoints * 1000)),
    returnPoints: String(Math.round(settings.returnPoints * 1000)),
    tobi: settings.tobi,
    chip: false, // 呼び出し側でchipConfig.enabledから上書きする
  };
}

export function toChipConfigForm(chipConfig: StoredChipConfig): ChipConfigForm {
  return {
    startChips: chipConfig.startChips,
    pricePerChip: chipConfig.pricePerChip,
  };
}

/** フォーム入力を保存用SessionSettingsに変換 */
export function fromSettingsForm(
  form: SessionSettingsForm,
  playerCount: number,
  tobiPenalty = 10,
): StoredSettings {
  const isThreePlayer = playerCount === 3;
  const umaMap = isThreePlayer ? UMA_MAP_3 : UMA_MAP_4;
  return {
    rate: RATE_MAP[form.rate] ?? 100,
    uma: umaMap[form.uma] ?? (isThreePlayer ? [30, 0, -30] : [30, 10, -10, -30]),
    startPoints: parseInt(form.startPoints) / 1000,
    returnPoints: parseInt(form.returnPoints) / 1000,
    tobi: form.tobi,
    tobiPenalty,
  };
}

export function fromChipConfigForm(form: ChipConfigForm, enabled: boolean): StoredChipConfig {
  return {
    enabled,
    startChips: form.startChips,
    pricePerChip: form.pricePerChip,
  };
}
