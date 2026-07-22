import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const CITY_BBOX: Record<string, string> = {
  "Tashkent": "69.20,41.28,69.35,41.36",
  "Shamsiko'l": "66.78,39.02,66.88,39.08",
  "Sho'rqo'rg'on": "66.70,38.87,66.80,38.93",
  "Elatan": "66.85,39.07,66.95,39.13",
};
const CITY_MARKER: Record<string, string> = {
  "Tashkent": "41.3111,69.2797",
  "Shamsiko'l": "39.05,66.83",
  "Sho'rqo'rg'on": "38.9,66.75",
  "Elatan": "39.1,66.9",
};

export function VillageMap({ city = "Tashkent" }: { city?: string }) {
  const bbox = CITY_BBOX[city] ?? CITY_BBOX["Tashkent"];
  const marker = CITY_MARKER[city] ?? CITY_MARKER["Tashkent"];
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="font-display font-bold text-sm">Qishloq xaritasi</p>
        </div>
        <span className="text-[11px] text-muted-foreground">{city}</span>
      </div>
      <div className="w-full h-56 sm:h-72 bg-muted">
        <iframe
          title={`${city} xaritasi`}
          src={src}
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    </Card>
  );
}
