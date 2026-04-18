import type { SessionSettings } from "@/app/session/new/page";
import { Card } from "@/components/ui";

type Props = {
  settings: SessionSettings;
  onUpdate: (patch: Partial<SessionSettings>) => void;
  playerCount?: number;
};

const RATE_OPTIONS = [
  { value: "norate", label: "ノーレート", hint: "0pt" },
  { value: "tengo", label: "テンゴ", hint: "1000点=50pt" },
  { value: "tenpin", label: "テンピン", hint: "1000点=100pt" },
  { value: "ten2", label: "点2", hint: "1000点=200pt" },
  { value: "ten5", label: "点5", hint: "1000点=500pt" },
];

const UMA_OPTIONS_4 = [
  { value: "none", label: "ナシ", hint: "ウマなし" },
  { value: "5-10", label: "5-10", hint: "ゴットー" },
  { value: "10-20", label: "10-20", hint: "ワンツー" },
  { value: "10-30", label: "10-30", hint: "ワンスリー" },
  { value: "20-30", label: "20-30", hint: "ツースリー" },
];

const UMA_OPTIONS_3 = [
  { value: "none", label: "ナシ", hint: "ウマなし" },
  { value: "5-10", label: "10", hint: "1位+10 / 3位-10" },
  { value: "10-20", label: "20", hint: "1位+20 / 3位-20" },
  { value: "10-30", label: "30", hint: "1位+30 / 3位-30" },
  { value: "20-30", label: "20-30", hint: "1位+30 / 3位-20" },
];

const POINT_OPTIONS = [
  { value: "25000", label: "25,000" },
  { value: "30000", label: "30,000" },
];

const RETURN_OPTIONS = [
  { value: "30000", label: "30,000" },
  { value: "40000", label: "40,000" },
];

export function RuleSettings({ settings, onUpdate, playerCount = 4 }: Props) {
  const umaOptions = playerCount === 3 ? UMA_OPTIONS_3 : UMA_OPTIONS_4;

  return (
    <Card padding="md">
      <h3 className="font-serif-jp text-base font-bold text-[var(--ink)]">ルール</h3>

      <Field label="レート">
        <PillGrid
          cols={3}
          options={RATE_OPTIONS}
          value={settings.rate}
          onSelect={(v) => onUpdate({ rate: v })}
        />
      </Field>

      <Field label="ウマ">
        <PillGrid
          cols={3}
          options={umaOptions}
          value={settings.uma}
          onSelect={(v) => onUpdate({ uma: v })}
        />
      </Field>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="持ち点" inline>
          <SegRow
            options={POINT_OPTIONS}
            value={settings.startPoints}
            onSelect={(v) => onUpdate({ startPoints: v })}
          />
        </Field>
        <Field label="返し点" inline>
          <SegRow
            options={RETURN_OPTIONS}
            value={settings.returnPoints}
            onSelect={(v) => onUpdate({ returnPoints: v })}
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Toggle
          label="飛び賞"
          hint="±10pt"
          on={settings.tobi}
          onChange={() => onUpdate({ tobi: !settings.tobi })}
        />
        <Toggle
          label="チップ"
          hint="赤・一発・裏"
          on={settings.chip}
          onChange={() => onUpdate({ chip: !settings.chip })}
        />
      </div>
    </Card>
  );
}

function Field({
  label,
  children,
  inline = false,
}: {
  label: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "" : "mt-4"}>
      <div className="mb-2 text-[11px] tracking-widest text-[var(--ink-subtle)]">{label}</div>
      {children}
    </div>
  );
}

function PillGrid({
  cols,
  options,
  value,
  onSelect,
}: {
  cols: number;
  options: { value: string; label: string; hint: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onSelect(o.value)}
            className={`flex flex-col items-start rounded-[var(--radius-md)] border px-3 py-2 text-left transition-colors ${
              active
                ? "border-[var(--accent)] bg-[var(--surface)]"
                : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--ink-subtle)]"
            }`}
          >
            <span className={`text-sm font-medium ${active ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}>
              {o.label}
            </span>
            <span className="text-[10px] text-[var(--ink-subtle)]">{o.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function SegRow({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex rounded-[var(--radius-md)] border border-[var(--line)] p-0.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onSelect(o.value)}
            className={`flex-1 rounded-[var(--radius-sm)] py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors ${
        on
          ? "border-[var(--accent)] bg-[var(--surface)]"
          : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--ink-subtle)]"
      }`}
    >
      <div>
        <div className={`text-sm font-medium ${on ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}>
          {label}
        </div>
        <div className="text-[10px] text-[var(--ink-subtle)]">{hint}</div>
      </div>
      <span
        className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
          on ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
        }`}
        aria-hidden
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-4" : ""
          }`}
        />
      </span>
    </button>
  );
}
