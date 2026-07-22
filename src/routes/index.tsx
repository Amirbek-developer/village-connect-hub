import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Megaphone, ShoppingBasket, Wrench, Landmark, HeartPulse,
  Users, Calendar, ChevronRight, Clock, Phone, Flame, Shield, Ambulance,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { PrayerTimes } from "@/components/shared/PrayerTimes";
import { WeatherCard } from "@/components/shared/WeatherCard";
import { VillageMap } from "@/components/shared/VillageMap";

const WEEKDAYS_UZ = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
const MONTHS_UZ = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];


function formatUzDate(d: Date) {
  return `${d.getDate()}-${MONTHS_UZ[d.getMonth()]}, ${WEEKDAYS_UZ[d.getDay()]}`;
}
function formatUzTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function greeting(d: Date) {
  const h = d.getHours();
  if (h < 5) return "Xayrli tun";
  if (h < 11) return "Xayrli tong";
  if (h < 17) return "Assalomu alaykum";
  if (h < 21) return "Xayrli kun";
  return "Xayrli kech";
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QishloqNet — Bosh sahifa" },
      { name: "description", content: "Sizning qishlog'ingiz hayoti — e'lonlar, bozor, xizmatlar va jamoa muhokamasi bir joyda." },
    ],
  }),
  component: HomePage,
});

const QUICK = [
  { to: "/announcements", icon: Megaphone, label: "E'lon qo'sh", color: "bg-primary/10 text-primary" },
  { to: "/marketplace", icon: ShoppingBasket, label: "Bozor", color: "bg-secondary/20 text-secondary-foreground" },
  { to: "/services", icon: Wrench, label: "Usta topish", color: "bg-info/15 text-info" },
  { to: "/gov", icon: Landmark, label: "Muammo bildir", color: "bg-accent/15 text-accent" },
  { to: "/health", icon: HeartPulse, label: "Yordam so'ra", color: "bg-destructive/10 text-destructive" },
  { to: "/forum", icon: Users, label: "Jamoa forumi", color: "bg-success/15 text-success" },
] as const;

function HomePage() {
  const { t } = useT();
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(i);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["home-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name,last_name,village_id,villages(name)")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });
  const firstName = profile?.first_name ?? "";
  const villageRel = (profile as { villages?: { name?: string } | null } | null)?.villages;
  const villageName: string = villageRel?.name ?? "Tashkent";

  const { data: rates } = useQuery({
    queryKey: ["cbu-rates"],
    queryFn: async () => {
      const res = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/");
      const json = await res.json();
      const pick = (code: string) => json.find((r: { Ccy: string }) => r.Ccy === code);
      return { USD: pick("USD"), EUR: pick("EUR"), RUB: pick("RUB") };
    },
    staleTime: 1000 * 60 * 60,
  });


  return (
    <AppLayout>
      {/* HERO */}
      <section className="px-4 lg:px-6 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground p-6 sm:p-8 shadow-warm">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-secondary/30 blur-3xl" aria-hidden />
          <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-widest text-primary-foreground/80">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {formatUzDate(now)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {formatUzTime(now)}
              </span>
            </p>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-balance">
              {greeting(now)}{firstName ? "," : "!"}{" "}
              {firstName && <span className="text-secondary">{firstName}</span>}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-primary-foreground/90 max-w-xl text-balance">
              {t("home.tagline")} — mahalliy e'lonlar, bozor, xizmatlar va jamoa muhokamasi bir joyda.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/announcements" className="rounded-full bg-background/15 hover:bg-background/25 backdrop-blur px-4 py-2 text-sm font-medium transition">
                E'lonlarni ko'rish
              </Link>
              <Link to="/marketplace" className="rounded-full bg-secondary text-secondary-foreground hover:opacity-90 px-4 py-2 text-sm font-bold transition">
                Bozorga kirish
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PRAYER TIMES */}
      <section className="px-4 lg:px-6 mt-6">
        <PrayerTimes city={villageName} />
      </section>



      {/* QUICK ACTIONS */}
      <section className="px-4 lg:px-6 mt-8">
        <h2 className="font-display text-lg font-bold mb-3">{t("home.quickActions")}</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.to}
                to={q.to}
                className="card-hover flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center"
              >
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${q.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium leading-tight">{q.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* WEATHER + MAP */}
      <section className="px-4 lg:px-6 mt-8 grid gap-4 md:grid-cols-2">
        <WeatherCard city={villageName} />
        <VillageMap city={villageName} />
      </section>

      {/* CURRENCY RATES */}
      <section className="px-4 lg:px-6 mt-8">
        <h2 className="font-display text-lg font-bold mb-3">Valyuta kurslari (CBU)</h2>
        <div className="grid grid-cols-3 gap-3">
          {(["USD", "EUR", "RUB"] as const).map((c) => {
            const r = rates?.[c];
            return (
              <Card key={c} className="p-4">
                <p className="text-xs text-muted-foreground">{c} / UZS</p>
                <p className="font-display text-xl font-extrabold mt-1">
                  {r ? Number(r.Rate).toLocaleString("uz-UZ", { maximumFractionDigits: 2 }) : "—"}
                </p>
                {r && (
                  <p className={`text-[11px] mt-1 ${Number(r.Diff) >= 0 ? "text-success" : "text-destructive"}`}>
                    {Number(r.Diff) >= 0 ? "▲" : "▼"} {Math.abs(Number(r.Diff)).toFixed(2)}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* EMERGENCY CONTACTS */}
      <section className="px-4 lg:px-6 mt-8">
        <h2 className="font-display text-lg font-bold mb-3">Favqulodda raqamlar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { n: "101", label: "Yong'in xizmati", icon: Flame, color: "bg-destructive/10 text-destructive" },
            { n: "102", label: "Militsiya", icon: Shield, color: "bg-info/15 text-info" },
            { n: "103", label: "Tez yordam", icon: Ambulance, color: "bg-success/15 text-success" },
            { n: "1050", label: "Ishonch telefoni", icon: Phone, color: "bg-accent/15 text-accent" },
          ].map((e) => {
            const Icon = e.icon;
            return (
              <a key={e.n} href={`tel:${e.n}`} className="card-hover">
                <Card className="p-4 flex items-center gap-3">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${e.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-extrabold leading-none">{e.n}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{e.label}</p>
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      </section>

      {/* EVENTS / TIPS */}
      <section className="px-4 lg:px-6 mt-8 mb-8">
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-5 border-l-4 border-l-accent">
            <Calendar className="h-5 w-5 text-accent mb-2" />
            <p className="font-display font-bold">Tadbirlar takvimi</p>
            <p className="text-sm text-muted-foreground mt-1">Yaqinlashayotgan to'ylar, bayramlar va mahalla uchrashuvlarini kuzating.</p>
            <Link to="/announcements" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              Takvimni ochish <ChevronRight className="h-4 w-4" />
            </Link>
          </Card>
          <Card className="p-5 border-l-4 border-l-primary">
            <Users className="h-5 w-5 text-primary mb-2" />
            <p className="font-display font-bold">Jamoa forumi</p>
            <p className="text-sm text-muted-foreground mt-1">Qishloqdoshlar bilan muhokamalarga qo'shiling, savol bering va yordam bering.</p>
            <Link to="/forum" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Forumga o'tish <ChevronRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </section>

    </AppLayout>
  );
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-end justify-between mb-3 gap-3">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <Link to={to} className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5">
        Hammasi <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hue }: {
  icon: typeof Megaphone; label: string; value: number;
  hue: "primary" | "secondary" | "info" | "accent";
}) {
  const hueMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/20 text-secondary-foreground",
    info: "bg-info/15 text-info",
    accent: "bg-accent/15 text-accent",
  };
  return (
    <Card className="p-4 animate-[count-up_0.5s_ease-out]">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${hueMap[hue]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold">{value.toLocaleString("uz-UZ")}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
