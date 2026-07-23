import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Megaphone, ShoppingBasket, Wrench, Landmark, HeartPulse,
  Users, ChevronRight, Clock, Phone, Flame, Shield, Ambulance,
  Sparkles, Moon, ExternalLink, Lightbulb, TrendingUp, Wheat, Activity, Quote, Calendar,
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

const TIPS = [
  "Ekinlarni erta tongda sug'orish suvni tejaydi va o'simlik ildizini kuydirmaydi.",
  "Qo'shningizning hol-ahvolini so'rash — sadaqadir. Bugun kimgadir qo'ng'iroq qiling.",
  "Elektr energiyasini tejash uchun LED lampalardan foydalaning — 80% gacha tejaydi.",
  "Bolalarning kunlik ekran vaqti 2 soatdan oshmasligi tavsiya etiladi.",
  "Uy hayvonlariga toza suv har kuni yangilanib turilishi kerak.",
  "Bozorga ro'yxat bilan boring — ortiqcha xarajatning oldini oladi.",
  "Kuniga 8 stakan suv iching — sog'liq va tetiklik uchun eng arzon dori.",
  "Mahalla yig'ilishlarida ishtirok eting — qarorlar sizsiz qabul qilinmasin.",
];

const USEFUL_LINKS = [
  { name: "my.gov.uz", desc: "Davlat xizmatlari", url: "https://my.gov.uz" },
  { name: "soliq.uz", desc: "Soliq to'lovlari", url: "https://soliq.uz" },
  { name: "hemis.uz", desc: "Ta'lim tizimi", url: "https://hemis.uz" },
  { name: "pochta.uz", desc: "Pochta xizmatlari", url: "https://pochta.uz" },
];


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

  const { data: hijri } = useQuery({
    queryKey: ["hijri", now.toDateString()],
    queryFn: async () => {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const res = await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${d.getFullYear()}`);
      const json = await res.json();
      const h = json?.data?.hijri;
      return h ? `${h.day}-${h.month.en} ${h.year}` : null;
    },
    staleTime: 1000 * 60 * 60 * 6,
  });

  const { data: latestAnnouncements } = useQuery({
    queryKey: ["home-latest-announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id,title,created_at,type")
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const { data: marketPreview } = useQuery({
    queryKey: ["home-market-preview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title,price,image_url,created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });


  const tipOfDay = useMemo(() => {
    const day = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    return TIPS[day % TIPS.length];
  }, [now]);

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
              {hijri && (
                <span className="inline-flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5" /> {hijri}
                </span>
              )}
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

      {/* TIP OF THE DAY */}
      <section className="px-4 lg:px-6 mt-8">
        <Card className="p-5 bg-gradient-to-br from-secondary/20 to-accent/10 border-l-4 border-l-secondary flex gap-4 items-start">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary/30 text-secondary-foreground shrink-0">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Kunlik maslahat</p>
            <p className="font-display font-semibold mt-1 text-balance">{tipOfDay}</p>
          </div>
        </Card>
      </section>

      {/* LATEST ANNOUNCEMENTS */}
      <section className="px-4 lg:px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> So'nggi e'lonlar
          </h2>
          <Link to="/announcements" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Barchasi <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {latestAnnouncements && latestAnnouncements.length > 0 ? (
          <div className="grid gap-2">
            {latestAnnouncements.map((a) => (
              <Link
                key={a.id}
                to="/announcements"
                className="card-hover flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {a.type ?? "E'lon"} · {new Date(a.created_at).toLocaleDateString("uz-UZ")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-4 text-sm text-muted-foreground text-center">Hozircha e'lonlar yo'q</Card>
        )}
      </section>

      {/* USEFUL GOV LINKS */}
      <section className="px-4 lg:px-6 mt-8">
        <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" /> Foydali xizmatlar
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {USEFUL_LINKS.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="card-hover"
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-display font-bold">{l.name}</p>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{l.desc}</p>
              </Card>
            </a>
          ))}
        </div>
      </section>

      {/* NEW MEMBERS */}
      <section className="px-4 lg:px-6 mt-8">
        <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-success" /> Yangi a'zolar
        </h2>
        <Card className="p-4">
          {newMembers && newMembers.length > 0 ? (
            <ul className="flex flex-wrap gap-4">
              {newMembers.map((m) => {
                const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";
                const init = name.split(" ").map((s) => s[0]?.toUpperCase() ?? "").slice(0, 2).join("");
                return (
                  <li key={m.id} className="flex flex-col items-center gap-1 w-16">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/15 text-primary grid place-items-center text-sm font-bold">
                        {init}
                      </div>
                    )}
                    <p className="text-[11px] text-center truncate w-full">{name.split(" ")[0]}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center">Hozircha a'zolar yo'q</p>
          )}
        </Card>
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

