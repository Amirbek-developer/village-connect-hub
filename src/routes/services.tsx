import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wrench, Plus, Star, Phone, ShieldCheck, Hammer, Zap, ShoppingBag,
  ShoppingBasket, Briefcase, SearchCheck, Landmark, HeartPulse, GraduationCap,
  ChevronRight, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const SERVICE_CATEGORIES = [
  "Qurilish va ta'mirlash", "Transport", "Tibbiyot", "Ta'lim",
  "Go'zallik va sog'liq", "Ovqat va qahvaxona", "Moliya", "Qishloq xo'jaligi", "Boshqa",
];

type SubKey = "usta" | "elektrik" | "buyurtma";

const SUB_SERVICES: { key: SubKey; title: string; sub: string; icon: typeof Hammer; iconBg: string; category: string }[] = [
  { key: "usta",     title: "Usta topish",     sub: "Qurilish, ta'mirlash, hunarmandlar",     icon: Hammer,     iconBg: "bg-primary",   category: "Qurilish va ta'mirlash" },
  { key: "elektrik", title: "Elektrik",        sub: "Simlar, rozetkalar, LED yoritish",       icon: Zap,        iconBg: "bg-secondary", category: "Qurilish va ta'mirlash" },
  { key: "buyurtma", title: "Buyurtma berish", sub: "Do'kon, choyxona, sartaroshxona",         icon: ShoppingBag,iconBg: "bg-accent",    category: "Ovqat va qahvaxona" },
];

const LINK_ROWS: { to: string; title: string; sub: string; icon: typeof ShoppingBasket; iconBg: string }[] = [
  { to: "/marketplace", title: "Bozor",             sub: "Mahalliy mahsulotlar va xaridlar",   icon: ShoppingBasket, iconBg: "bg-primary" },
  { to: "/jobs",        title: "Ish o'rinlari",     sub: "Vakansiyalar va ish qidiruvi",       icon: Briefcase,      iconBg: "bg-secondary" },
  { to: "/lost-found",  title: "Yo'qolgan/Topilgan", sub: "Yo'qolgan va topilgan buyumlar",     icon: SearchCheck,    iconBg: "bg-accent" },
  { to: "/gov",         title: "Davlat xizmatlari", sub: "Hokimlik va rasmiy xizmatlar",       icon: Landmark,       iconBg: "bg-success" },
  { to: "/health",      title: "Sog'liq",           sub: "Shifoxona, dorixona, favqulodda",    icon: HeartPulse,     iconBg: "bg-destructive" },
  { to: "/education",   title: "Ta'lim",            sub: "Maktab, kurslar, o'quv resurslar",   icon: GraduationCap,  iconBg: "bg-foreground/80" },
];

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Xizmatlar — QishloqNet" }, { name: "description", content: "Mahalliy usta, hunarmand va xizmat ko'rsatuvchilarni toping." }] }),
  component: ServicesPage,
});

function ServicesPage() {
  const [openSub, setOpenSub] = useState<SubKey | null>(null);

  return (
    <AppLayout>
      <PageHeader
        title="Xizmatlar katalogi"
        subtitle="Tasdiqlangan ustalar va boshqa bo'limlar"
        action={<CreateServiceDialog />}
      />

      <div className="px-4 lg:px-6 pb-8 max-w-2xl mx-auto w-full space-y-5">
        {/* Xizmatlar dropdown-style list */}
        <Card className="overflow-hidden divide-y divide-border">
          {SUB_SERVICES.map((r) => (
            <SubServiceRow
              key={r.key}
              row={r}
              open={openSub === r.key}
              onToggle={() => setOpenSub(openSub === r.key ? null : r.key)}
            />
          ))}
        </Card>

        {/* Other sections (links) */}
        <div>
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Boshqa bo'limlar
          </p>
          <Card className="overflow-hidden divide-y divide-border">
            {LINK_ROWS.map((r) => {
              const Icon = r.icon;
              return (
                <Link
                  key={r.to}
                  to={r.to}
                  className="flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white", r.iconBg)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[15px] leading-tight">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function SubServiceRow({
  row, open, onToggle,
}: {
  row: typeof SUB_SERVICES[number];
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = row.icon;
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["services", row.category],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services").select("*")
        .eq("category", row.category)
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white", row.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] leading-tight">{row.title}</p>
          <p className="text-xs text-muted-foreground truncate">{row.sub}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 bg-muted/20">
          {isLoading ? (
            <div className="grid gap-2">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-muted/50" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Wrench} title="Bu bo'limda xizmat yo'q" description="Birinchi bo'lib o'z xizmatingizni qo'shing." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((s) => <ServiceCard key={s.id} s={s} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ServiceCard({ s }: { s: any }) {
  return (
    <Card className="p-4 card-hover">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Wrench className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className="font-display font-bold text-base leading-tight flex-1">{s.title}</p>
            {s.is_verified && <ShieldCheck className="h-4 w-4 text-success shrink-0" />}
          </div>
          <Badge variant="secondary" className="mt-1 text-[10px]">{s.category}</Badge>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-secondary fill-secondary" />
          <span className="font-semibold">{Number(s.rating ?? 0).toFixed(1)}</span>
          <span className="text-muted-foreground">({s.review_count ?? 0})</span>
        </span>
        {s.experience_years && <span className="text-muted-foreground">{s.experience_years} yil tajriba</span>}
      </div>
      {s.contact_phone && (
        <a href={`tel:${s.contact_phone}`} className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-accent text-accent-foreground text-xs font-bold py-2 hover:bg-accent/90 transition">
          <Phone className="h-3.5 w-3.5" /> Bog'lanish
        </a>
      )}
    </Card>
  );
}

function CreateServiceDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: "", category: SERVICE_CATEGORIES[0], description: "",
    priceFrom: "", priceTo: "", priceType: "negotiable" as const,
    experience: "", phone: "",
  });
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { error } = await supabase.from("services").insert({
        title: f.title, category: f.category, description: f.description,
        price_from: f.priceFrom ? Number(f.priceFrom) : null,
        price_to: f.priceTo ? Number(f.priceTo) : null,
        price_type: f.priceType, experience_years: f.experience ? Number(f.experience) : null,
        contact_phone: f.phone || null, provider_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Xizmat qo'shildi");
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["home-stats"] });
      setOpen(false);
      setF({ title: "", category: SERVICE_CATEGORIES[0], description: "", priceFrom: "", priceTo: "", priceType: "negotiable", experience: "", phone: "" });
    },
    onError: (e: Error) => toast.error(e.message === "auth" ? "Avval tizimga kiring" : e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 shadow-warm"><Plus className="h-4 w-4" />Xizmat qo'sh</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Yangi xizmat</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div><Label className="text-xs">Xizmat nomi</Label>
            <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={150} placeholder="Elektrik usta" />
          </div>
          <div><Label className="text-xs">Kategoriya</Label>
            <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Tavsif</Label>
            <Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required rows={3} maxLength={1000} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Narx (dan)</Label>
              <Input type="number" min={0} value={f.priceFrom} onChange={(e) => setF({ ...f, priceFrom: e.target.value })} />
            </div>
            <div><Label className="text-xs">Tajriba (yil)</Label>
              <Input type="number" min={0} max={70} value={f.experience} onChange={(e) => setF({ ...f, experience: e.target.value })} />
            </div>
          </div>
          <div><Label className="text-xs">Telefon</Label>
            <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+998 90 ..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Bekor</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saqlanmoqda..." : "Qo'shish"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
