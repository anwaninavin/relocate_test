import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACCOMMODATION_TYPES, GENDER_OPTIONS } from "@/types";

export interface DiscoveryFilterState {
  gender: string;
  ageMin: string;
  ageMax: string;
  college: string;
  budgetMax: string;
  accommodationType: string;
  arrivalWeek: string;
}

export const EMPTY_FILTERS: DiscoveryFilterState = {
  gender: "",
  ageMin: "",
  ageMax: "",
  college: "",
  budgetMax: "",
  accommodationType: "",
  arrivalWeek: "",
};

const ANY = "__any__";

export function DiscoveryFilters({
  value,
  onChange,
  showRoommateFilters,
}: {
  value: DiscoveryFilterState;
  onChange: (v: DiscoveryFilterState) => void;
  showRoommateFilters?: boolean;
}) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Select value={value.gender || ANY} onValueChange={(v) => onChange({ ...value, gender: v === ANY ? "" : v })}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any gender</SelectItem>
          {GENDER_OPTIONS.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="College"
        value={value.college}
        onChange={(e) => onChange({ ...value, college: e.target.value })}
      />

      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Age min"
          value={value.ageMin}
          onChange={(e) => onChange({ ...value, ageMin: e.target.value })}
        />
        <Input
          type="number"
          placeholder="Age max"
          value={value.ageMax}
          onChange={(e) => onChange({ ...value, ageMax: e.target.value })}
        />
      </div>

      {showRoommateFilters && (
        <>
          <Input
            type="number"
            placeholder="Max budget (₹/mo)"
            value={value.budgetMax}
            onChange={(e) => onChange({ ...value, budgetMax: e.target.value })}
          />
          <Select
            value={value.accommodationType || ANY}
            onValueChange={(v) => onChange({ ...value, accommodationType: v === ANY ? "" : v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Accommodation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any type</SelectItem>
              {ACCOMMODATION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Arrival week"
            value={value.arrivalWeek}
            onChange={(e) => onChange({ ...value, arrivalWeek: e.target.value })}
          />
        </>
      )}
    </div>
  );
}

export function buildDiscoveryQuery(filters: DiscoveryFilterState): string {
  const params = new URLSearchParams();
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.ageMin) params.set("ageMin", filters.ageMin);
  if (filters.ageMax) params.set("ageMax", filters.ageMax);
  if (filters.college) params.set("college", filters.college);
  if (filters.budgetMax) params.set("budgetMax", filters.budgetMax);
  if (filters.accommodationType) params.set("accommodationType", filters.accommodationType);
  if (filters.arrivalWeek) params.set("arrivalWeek", filters.arrivalWeek);
  return params.toString();
}
