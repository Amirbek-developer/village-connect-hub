import { useQuery } from "@tanstack/react-query";
import { Cloud, CloudRain, CloudSnow, Sun, CloudSun, Wind, Droplets } from "lucide-react";
import { Card } from "@/components/ui/card";

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "Tashkent": { lat: 41.3111, lon: 69.2797 },
  "Shamsiko'l": { lat: 39.05, lon: 66.83 },
  "Sho'rqo'rg'on": { lat: 38.9, lon: 66.75 },
  "Elatan": { lat: 39.1, lon: 66.9 },
};

function iconFor(code: number) {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code <= 48) return Cloud;
  if (code <= 67) return CloudRain;
  if (code <= 77) return CloudSnow;
  if (code <= 82) return CloudRain;
  return Cloud;
}
function textFor(code: number) {
  if (code === 0) return "Ochiq havo";
  if (code <= 2) return "Bulutli quyoshli";
  if (code <= 48) return "Bulutli";
  if (code <= 67) return "Yomg'irli";
  if (code <= 77) return "Qorli";
  if (code <= 82) return "Jala";
  return "O'zgaruvchan";
}

export function WeatherCard({ city = "Tashkent" }: { city?: string }) {
  const coords = CITY_COORDS[city] ?? CITY_COORDS["Tashkent"];
  const { data, isLoading } = useQuery({
    queryKey: ["weather", coords.lat, coords.lon],
    queryFn: async () => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`,
      );
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  const current = data?.current;
  const Icon = current ? iconFor(current.weather_code) : Sun;

  return (
    <Card className="p-5 bg-gradient-to-br from-info/10 via-primary/5 to-secondary/10 border-info/20">
      <div className="flex items-center justify-between mb-2">
        <p className="font-display font-bold text-sm">Ob-havo</p>
        <span className="text-[11px] text-muted-foreground">{city}</span>
      </div>
      {isLoading || !current ? (
        <p className="text-xs text-muted-foreground py-6 text-center">Yuklanmoqda…</p>
      ) : (
        <div className="flex items-center gap-4">
          <Icon className="h-14 w-14 text-info" />
          <div className="flex-1">
            <p className="font-display text-3xl font-extrabold leading-none">
              {Math.round(current.temperature_2m)}°C
            </p>
            <p className="text-xs text-muted-foreground mt-1">{textFor(current.weather_code)}</p>
            <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Wind className="h-3 w-3" />{Math.round(current.wind_speed_10m)} km/s</span>
              <span className="inline-flex items-center gap-1"><Droplets className="h-3 w-3" />{current.relative_humidity_2m}%</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
