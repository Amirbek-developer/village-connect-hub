import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Moon, Sunrise, Sun, Sunset, CloudMoon, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

type Timings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

const LABELS: { key: keyof Timings; label: string; icon: typeof Sun }[] = [
  { key: "Fajr", label: "Bomdod", icon: CloudMoon },
  { key: "Sunrise", label: "Quyosh", icon: Sunrise },
  { key: "Dhuhr", label: "Peshin", icon: Sun },
  { key: "Asr", label: "Asr", icon: Sun },
  { key: "Maghrib", label: "Shom", icon: Sunset },
  { key: "Isha", label: "Xufton", icon: Moon },
];

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function PrayerTimes({ city = "Tashkent" }: { city?: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["prayer-times", city, now.toDateString()],
    queryFn: async () => {
      const d = new Date();
      const dateStr = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=Uzbekistan&method=2`,
      );
      const json = await res.json();
      return json?.data?.timings as Timings;
    },
    staleTime: 1000 * 60 * 60,
  });

  const currentMin = now.getHours() * 60 + now.getMinutes();
  let nextKey: keyof Timings | null = null;
  if (data) {
    for (const { key } of LABELS) {
      if (toMinutes(data[key]) > currentMin) {
        nextKey = key;
        break;
      }
    }
    if (!nextKey) nextKey = "Fajr";
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <p className="font-display font-bold text-sm">Namoz vaqtlari</p>
        </div>
        <span className="text-[11px] text-muted-foreground">{city}</span>
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Yuklanmoqda…</p>
      ) : isError || !data ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Vaqtlarni olishda xatolik</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {LABELS.map(({ key, label, icon: Icon }) => {
            const active = nextKey === key;
            return (
              <div
                key={key}
                className={`rounded-xl p-2.5 text-center border ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-warm"
                    : "bg-muted/40 border-border"
                }`}
              >
                <Icon className={`h-4 w-4 mx-auto mb-1 ${active ? "" : "text-primary"}`} />
                <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
                <p className="font-display font-bold text-sm mt-0.5">{data[key]}</p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
