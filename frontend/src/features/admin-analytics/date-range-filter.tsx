import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DateRangeValue {
  from: string;
  to: string;
}

const PRESETS: { label: string; days: number }[] = [
  { label: "Today", days: 0 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function presetRange(days: number): DateRangeValue {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

export function DateRangeFilter({ value, onChange }: { value: DateRangeValue; onChange: (v: DateRangeValue) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-full bg-muted p-1">
        {PRESETS.map((preset) => {
          const active = value.from === presetRange(preset.days).from;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(presetRange(preset.days))}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="h-9 w-[150px] text-xs"
        />
        <span className="text-muted-foreground text-xs">to</span>
        <Input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="h-9 w-[150px] text-xs"
        />
      </div>
    </div>
  );
}

export function RefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={loading}>
      {loading ? "Loading…" : "Refresh"}
    </Button>
  );
}
