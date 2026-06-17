import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Megaphone, ShoppingBasket, Wrench, Landmark, HeartPulse, MapPin,
  TrendingUp, Users, Calendar, ChevronRight, Clock,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { formatPrice, timeAgo } from "@/lib/format";
import { PrayerTimes } from "@/components/shared/PrayerTimes";

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
  const today = new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [ann, prod, srv, iss] = await Promise.all([
        supabase.from("announcements").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("issues").select("id", { count: "exact", head: true }),
      ]);
      return {
        announcements: ann.count ?? 0,
        products: prod.count ?? 0,
        services: srv.count ?? 0,
        issues: iss.count ?? 0,
      };
    },
  });

  const { data: latestAnn = [] } = useQuery({
    queryKey: ["home-latest-ann"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id,title,type,is_urgent,created_at,images")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: latestProducts = [] } = useQuery({
    queryKey: ["home-latest-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title,price,unit,images,category,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  return (
    <AppLayout>
      {/* HERO */}
      <section className="px-4 lg:px-6 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground p-6 sm:p-8 shadow-warm">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-secondary/30 blur-3xl" aria-hidden />
          <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-foreground/80">
              <Sun className="h-3.5 w-3.5" /> {today} · 24°C
            </p>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-balance">
              {t("home.welcome")}{user ? "," : "!"}{" "}
              {user && <span className="text-secondary">{user.email?.split("@")[0]}</span>}
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

      {/* STATS */}
      <section className="px-4 lg:px-6 mt-8">
        <h2 className="font-display text-lg font-bold mb-3">{t("home.stats")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Megaphone} label="E'lonlar" value={stats?.announcements ?? 0} hue="primary" />
          <StatCard icon={ShoppingBasket} label="Mahsulotlar" value={stats?.products ?? 0} hue="secondary" />
          <StatCard icon={Wrench} label="Xizmatlar" value={stats?.services ?? 0} hue="info" />
          <StatCard icon={MapPin} label="Muammolar" value={stats?.issues ?? 0} hue="accent" />
        </div>
      </section>

      {/* LATEST ANNOUNCEMENTS */}
      <section className="px-4 lg:px-6 mt-8">
        <SectionHeader title={t("home.latestAnn")} to="/announcements" />
        {latestAnn.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("common.empty")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latestAnn.map((a) => (
              <Link key={a.id} to="/announcements" className="card-hover">
                <Card className="p-4 h-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={a.is_urgent ? "destructive" : "secondary"} className="text-[10px]">
                      {a.is_urgent ? "Shoshilinch" : a.type === "official" ? "Rasmiy" : a.type === "event" ? "Tadbir" : "Yangilik"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(a.created_at)}</span>
                  </div>
                  <p className="font-display font-bold text-sm leading-snug line-clamp-2">{a.title}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="px-4 lg:px-6 mt-8">
        <SectionHeader title={t("home.market")} to="/marketplace" />
        {latestProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("common.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {latestProducts.map((p) => (
              <Link key={p.id} to="/marketplace" className="card-hover">
                <Card className="overflow-hidden h-full p-0">
                  <div className="aspect-square bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center text-secondary-foreground">
                    <ShoppingBasket className="h-8 w-8 opacity-40" />
                  </div>
                  <div className="p-2.5">
                    <p className="font-medium text-xs line-clamp-1">{p.title}</p>
                    <p className="font-display font-bold text-sm text-primary mt-1">{formatPrice(p.price, p.unit)}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
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
            <TrendingUp className="h-5 w-5 text-primary mb-2" />
            <p className="font-display font-bold">Mahalliy fermer bozori</p>
            <p className="text-sm text-muted-foreground mt-1">To'g'ridan-to'g'ri fermerdan mevali, sabzavot va sut mahsulotlari.</p>
            <Link to="/marketplace" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Bozorga o'tish <ChevronRight className="h-4 w-4" />
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
