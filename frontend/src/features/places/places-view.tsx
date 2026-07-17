import { useEffect, useMemo, useState } from "react";
import { Compass, Heart } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { PLACE_CATEGORIES } from "@/types";
import { PlaceCard } from "@/features/places/place-card";
import { toPlaceDTO, type PlaceDTO, type PlaceRaw } from "@/features/places/place-dto";
import { toCityOptionDTO, type CityOptionDTO, type CityOptionRaw } from "@/features/auth/college-taxonomy-dto";

const ANY = "__any__";

export function PlacesView({ defaultCity }: { defaultCity: string }) {
  const [city, setCity] = useState(defaultCity);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [places, setPlaces] = useState<PlaceDTO[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [cities, setCities] = useState<CityOptionDTO[]>([]);

  async function fetchFavorites() {
    try {
      const { places: raw } = await api.get<{ places: PlaceRaw[] }>("/api/places/favorites");
      setFavoriteIds(new Set(raw.map((p) => p._id)));
    } catch {
      // favourites are non-critical — fail silently
    }
  }

  async function fetchPlaces() {
    if (showFavorites) {
      try {
        const { places: raw } = await api.get<{ places: PlaceRaw[] }>("/api/places/favorites");
        setPlaces(raw.map(toPlaceDTO));
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load favourites");
      }
      return;
    }
    if (!city.trim()) {
      setPlaces([]);
      return;
    }
    const params = new URLSearchParams({ city });
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    try {
      const { places: raw } = await api.get<{ places: PlaceRaw[] }>(`/api/places?${params.toString()}`);
      setPlaces(raw.map(toPlaceDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load places");
    }
  }

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    api
      .get<{ cities: CityOptionRaw[] }>("/api/cities")
      .then(({ cities: raw }) => {
        const options = raw.map(toCityOptionDTO);
        setCities(options);
        // The travel profile takes the destination city as free text
        // (discovery/travel-profile-form.tsx), so it may differ from the catalog by case. The
        // API doesn't care — it matches case-insensitively — but Select needs an exact match
        // against an item to show anything, so snap to the catalog's spelling.
        setCity((current) => options.find((c) => c.name.toLowerCase() === current.toLowerCase())?.name ?? current);
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load cities"));
  }, []);

  useEffect(() => {
    fetchPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, category, search, showFavorites]);

  /** Catalog cities, plus the selected one if the catalog has no spelling of it at all — a
   * free-text profile can say "Bangalore" where the catalog says "Bengaluru". Listing it keeps
   * the picker honest about what's being searched (and why it found nothing) instead of
   * rendering blank over a live filter. */
  const cityOptions = useMemo(() => {
    const names = cities.map((c) => c.name);
    if (city && !names.some((name) => name.toLowerCase() === city.toLowerCase())) return [city, ...names];
    return names;
  }, [cities, city]);

  const empty = showFavorites
    ? { title: "No favourites yet", description: "Save places you like to see them here." }
    : !city.trim()
      ? { title: "Choose a city to explore", description: "Pick a city above to see places and eateries worth your time." }
      : { title: "No places found", description: "Try a different city or category." };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {!showFavorites && (
          <>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category || ANY} onValueChange={(v) => setCategory(v === ANY ? "" : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All categories</SelectItem>
                {PLACE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[160px]" />
          </>
        )}
        <Button
          variant={showFavorites ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFavorites((v) => !v)}
          className="ml-auto"
        >
          <Heart className="size-4" /> Favourites
        </Button>
      </div>

      {places.length === 0 ? (
        <EmptyState icon={Compass} title={empty.title} description={empty.description} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} isFavorite={favoriteIds.has(place.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
