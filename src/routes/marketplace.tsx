import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingBasket, Plus, MapPin, Phone, Search, Tag } from "lucide-react";
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
import { formatPrice, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "Mahalliy bozor — QishloqNet" }, { name: "description", content: "Qishloq ichidagi mahsulot va xizmatlarni soting yoki sotib oling." }] }),
  component: MarketPage,
});

const CATEGORIES = [
  "Sabzavot va meva", "Chorvachilik", "Sut va tuxum", "Don va un",
  "Texnika", "Kiyim-kechak", "Uy-ro'zg'or", "Qurilish", "Boshqa",
];

function MarketPage() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["products", cat],
    queryFn: async () => {
      let q = supabase.from("products").select("*").eq("status", "active").order("created_at", { ascending: false });
      if (cat !== "all") q = q.eq("category", cat);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = items.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Mahalliy bozor"
        subtitle="Qo'shnilaringizdan to'g'ridan-to'g'ri sotib oling"
        action={<CreateProductDialog />}
      />

      <div className="px-4 lg:px-6 space-y-4">
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Mahsulot qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha kategoriyalar</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="aspect-[3/4] animate-pulse bg-muted/40 p-0" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingBasket} title="Mahsulot topilmadi" description="Filterni o'zgartiring yoki o'zingiz birinchi bo'lib qo'shing." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-6">
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ProductCard({ p }: { p: any }) {
  return (
    <Card className="overflow-hidden p-0 card-hover">
      <div className="aspect-square bg-gradient-to-br from-secondary/20 via-primary/5 to-accent/10 flex items-center justify-center relative">
        <ShoppingBasket className="h-12 w-12 text-primary/30" />
        {p.is_barter && <Badge className="absolute top-2 left-2 bg-accent">Barter</Badge>}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">{p.title}</p>
        <p className="mt-1.5 font-display font-extrabold text-primary text-lg">{formatPrice(p.price, p.unit)}</p>
        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Tag className="h-3 w-3" /> <span className="truncate">{p.category}</span>
          <span className="ml-auto">{timeAgo(p.created_at)}</span>
        </div>
        {p.contact_phone && (
          <a href={`tel:${p.contact_phone}`} className="mt-2 flex items-center justify-center gap-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium py-1.5 hover:bg-primary/20 transition">
            <Phone className="h-3 w-3" /> Aloqa
          </a>
        )}
      </div>
    </Card>
  );
}

function CreateProductDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [phone, setPhone] = useState("");
  const [isBarter, setIsBarter] = useState(false);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { error } = await supabase.from("products").insert({
        title, description, price: price ? Number(price) : null, unit: unit || null,
        category, seller_id: user.id, contact_phone: phone || null, is_barter: isBarter,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mahsulot e'lon qilindi");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["home-stats"] });
      qc.invalidateQueries({ queryKey: ["home-latest-products"] });
      setOpen(false); setTitle(""); setDescription(""); setPrice(""); setUnit(""); setPhone(""); setIsBarter(false);
    },
    onError: (e: Error) => toast.error(e.message === "auth" ? "Avval tizimga kiring" : e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 shadow-warm bg-accent hover:bg-accent/90">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Mahsulot qo'sh</span><span className="sm:hidden">Sotish</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Yangi mahsulot</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div>
            <Label className="text-xs">Nomi</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} placeholder="Pomidor, qishki" />
          </div>
          <div>
            <Label className="text-xs">Tavsif</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} maxLength={1000} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Narx (so'm)</Label>
              <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} disabled={isBarter} placeholder="15000" />
            </div>
            <div>
              <Label className="text-xs">O'lchov (ixt.)</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg / dona" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Kategoriya</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Aloqa telefoni (ixt.)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 ..." />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isBarter} onChange={(e) => setIsBarter(e.target.checked)} />
            Barter (almashish)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Bekor</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saqlanmoqda..." : "E'lon qilish"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
