import { useEffect, useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { locationApi } from "@/lib/api";

const LS_KEY = "emergent_geo";

export function useUserLocation() {
  const [loc, setLoc] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch { return null; }
  });

  const request = async () => {
    if (!navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const { data } = await locationApi.reverseGeocode(lat, lng);
          const next = { lat, lng, city: data.city, state: data.state };
          localStorage.setItem(LS_KEY, JSON.stringify(next));
          setLoc(next);
          resolve(next);
        } catch {
          const next = { lat, lng, city: null, state: null };
          localStorage.setItem(LS_KEY, JSON.stringify(next));
          setLoc(next);
          resolve(next);
        }
      }, () => resolve(null), { timeout: 8000 });
    });
  };

  const clear = () => {
    localStorage.removeItem(LS_KEY);
    setLoc(null);
  };

  return { location: loc, request, clear };
}

export default function LocationChip({ onClick }) {
  const { location, request } = useUserLocation();
  return (
    <button
      type="button"
      onClick={() => (onClick ? onClick() : request())}
      data-testid="location-chip"
      className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs text-white/80 hover:text-white"
    >
      <MapPin className="h-3.5 w-3.5 text-pink-300" />
      <span className="max-w-[100px] truncate">
        {location?.city ? location.city : "Set location"}
      </span>
      <ChevronDown className="h-3 w-3 text-white/40" />
    </button>
  );
}
