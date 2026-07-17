import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GENDER_OPTIONS } from "@/types";

export interface DiscoveryFilterState {
  gender: string;
  ageMin: string;
  ageMax: string;
  college: string;
}

export const EMPTY_FILTERS: DiscoveryFilterState = {
  gender: "",
  ageMin: "",
  ageMax: "",
  college: "",
};

const ANY = "__any__";

/** Co-Packer's filter bar, and only Co-Packer's — Find a Roomie has no filters at all now, so
 * the budget and accommodation-type inputs that existed solely for it are gone along with it
 * (see RoommateView). */
export function DiscoveryFilters({
  value,
  onChange,
}: {
  value: DiscoveryFilterState;
  onChange: (v: DiscoveryFilterState) => void;
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
    </div>
  );
}

export function buildDiscoveryQuery(filters: DiscoveryFilterState): string {
  const params = new URLSearchParams();
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.ageMin) params.set("ageMin", filters.ageMin);
  if (filters.ageMax) params.set("ageMax", filters.ageMax);
  if (filters.college) params.set("college", filters.college);
  return params.toString();
}
