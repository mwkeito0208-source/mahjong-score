import type { Settlement } from "@/lib/settlement";

type Props = {
  title: string;
  icon: string;
  settlements: Settlement[];
  variant?: "default" | "highlight";
};

export function SettlementList({
  title,
  icon,
  settlements,
  variant = "default",
}: Props) {
  if (variant === "highlight") {
    return (
      <div className="mb-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white shadow-md">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
          {icon} {title}
        </h3>
        {settlements.length > 0 ? (
          <div className="space-y-3">
            {settlements.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-white/20 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.from}</span>
                  <span className="opacity-80">→</span>
                  <span className="font-medium">{s.to}</span>
                </div>
                <span className="text-lg font-bold">
                  {s.amount.toLocaleString()}pt
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-center opacity-80">精算なし</p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-700">
        {icon} {title}
      </h3>
      {settlements.length > 0 ? (
        <div className="space-y-3">
          {settlements.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-orange-50 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{s.from}</span>
                <span className="text-orange-500">→</span>
                <span className="font-medium text-gray-700">{s.to}</span>
              </div>
              <span className="font-bold text-orange-600">
                {s.amount.toLocaleString()}pt
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-2 text-center text-gray-500">精算なし</p>
      )}
    </div>
  );
}
