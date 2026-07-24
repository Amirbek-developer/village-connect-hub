import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wrench, Plus, Star, Phone, ShieldCheck, Hammer, Zap, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const SERVICE_CATEGORIES = [
  "Qurilish va ta'mirlash", "Transport", "Tibbiyot", "Ta'lim",
  "Go'zallik va sog'liq", "Ovqat va qahvaxona", "Moliya", "Qishloq xo'jaligi", "Boshqa",
];

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Xizmatlar — QishloqNet" }, { name: "description", content: "Mahalliy usta, hunarmand va xizmat ko'rsatuvchilarni toping." }] }),
  component: ServicesPage,
});

function ServicesPage() {
  const [cat, setCat] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["services", cat],
    queryFn: async () => {
      let q = supabase.from("services").select("*").order("rating", { ascending: false }).order("created_at", { ascending: false });
      if (cat !== "all") q = q.eq("category", cat);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppLayout>
      <PageHeader
        title="Xizmatlar katalogi"
        subtitle="Tasdiqlangan ustalar va xizmat ko'rsatuvchilar"
        action={<CreateServiceDialog />}
      />

      <div className="px-4 lg:px-6 space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Usta topish", icon: Hammer, value: "all", color: "bg-primary/10 text-primary" },
            { label: "Elektrik", icon: Zap, value: "Qurilish va ta'mirlash", color: "bg-secondary/20 text-secondary-foreground" },
            { label: "Buyurtma berish", icon: ShoppingBag, value: "Ovqat va qahvaxona", color: "bg-accent/15 text-accent" },
          ].map((tile) => {
            const Icon = tile.icon;
            const active = cat === tile.value;
            return (
              <button
                key={tile.label}
                onClick={() => setCat(tile.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-3 sm:p-4 text-center transition card-hover",
                  active ? "border-primary bg-primary/5" : "border-border bg-card"
                )}
              >
                <span className={cn("grid h-11 w-11 place-items-center rounded-xl", tile.color)}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold leading-tight">{tile.label}</span>
              </button>
            );
          })}
        </div>

        <Tabs value={cat} onValueChange={setCat}>
          <TabsList className="flex flex-wrap h-auto w-full sm:w-auto">
            <TabsTrigger value="all">Hammasi</TabsTrigger>
            {SERVICE_CATEGORIES.slice(0, 5).map((c) => (
              <TabsTrigger key={c} value={c} className="text-[11px]">{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>


        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-40 animate-pulse bg-muted/40" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Wrench} title="Xizmatlar yo'q" description="Ustaligingiz bormi? Birinchi bo'lib o'z xizmatingizni qo'shing." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-6">
            {items.map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        )}
      </div>
    </AppLayout>
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
          <span className="font-semibold">{s.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">({s.review_count})</span>
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
