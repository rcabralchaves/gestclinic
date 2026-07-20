import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays } from "lucide-react";

export const PERIOD_OPTIONS = [
  { value: "15d", label: "15 dias", days: 15 },
  { value: "1m", label: "1 mês", days: 30 },
  { value: "3m", label: "3 meses", days: 90 },
  { value: "6m", label: "6 meses", days: 180 },
  { value: "1a", label: "1 ano", days: 365 },
  { value: "2a", label: "2 anos", days: 730 },
  { value: "all", label: "Tudo", days: 0 },
] as const;

export type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"];

export function getDateLimit(period: PeriodValue): string | null {
  const opt = PERIOD_OPTIONS.find((o) => o.value === period);
  if (!opt || opt.days === 0) return null;
  const d = new Date();
  d.setDate(d.getDate() - opt.days);
  return d.toISOString().split("T")[0];
}

export function filterByPeriod<T extends { data: string }>(items: T[], period: PeriodValue): T[] {
  const limit = getDateLimit(period);
  if (!limit) return items;
  return items.filter((item) => item.data >= limit);
}

interface PeriodFilterProps {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
}

const PeriodFilter = ({ value, onChange }: PeriodFilterProps) => (
  <div className="flex items-center gap-2">
    <CalendarDays className="h-4 w-4 text-muted-foreground" />
    <Select value={value} onValueChange={(v) => onChange(v as PeriodValue)}>
      <SelectTrigger className="w-[130px] h-9 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default PeriodFilter;
