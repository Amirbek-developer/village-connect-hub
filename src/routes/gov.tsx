import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Landmark, Plus, MapPin, Clock, CheckCircle2, XCircle,
  AlertCircle, Loader2, FileText, Droplet, Zap, Trash2, Lightbulb,
  Construction, Flame,
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
import { timeAgo } from "@/lib/format";

type IssueType = "road" | "electricity" | "water" | "gas" | "garbage" | "lighting" | "other";

const TYPE_META: Record<IssueType, { label: string; icon: typeof Construction; color: string }> = {
  road: { label: "Yo'l", icon: Construction, color: "text-secondary-foreground bg-secondary/20" },
  electricity: { label: "Elektr", icon: Zap, color: "text-warning bg-warning/15" },
  water: { label: "Suv", icon: Droplet, color: "text-info bg-info/15" },
  gas: { label: "Gaz", icon: Flame, color: "text-accent bg-accent/15" },
  garbage: { label: "Axlat", icon: Trash2, color: "text-muted-foreground bg-muted" },
  lighting: { label: "Yoritish", icon: Lightbulb, color: "text-secondary-foreground bg-secondary/20" },
  other: { label: "Boshqa", icon: AlertCircle, color: "text-primary bg-primary/10" },
};

const STATUS_META = {
  pending: { label: "Kutilmoqda", icon: Clock, cls: "bg-muted text-muted-foreground" },
  reviewing: { label: "Ko'rib chiqilmoqda", icon: Loader2, cls: "bg-info/15 text-info" },
  in_progress: { label: "Bajarilmoqda", icon: Loader2, cls: "bg-secondary/20 text-secondary-foreground" },
  resolved: { label: "Hal qilindi", icon: CheckCircle2, cls: "bg-success/15 text-success" },
  rejected: { label: "Rad etildi", icon: XCircle, cls: "bg-destructive/10 text-destructive" },
} as const;

export const Route = createFileRoute("/gov")({
  head: () => ({ meta: [{ title: "Davlat xizmatlari — QishloqNet" }, { name: "description", content: "Mahalliy hokimiyat va kommunal xizmatlar bilan raqamli muloqot." }] }),
  component: GovPage,
});

function GovPage() {
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const { data, error } = await supabase.from("issues").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppLayout>
      <PageHeader
        title="Davlat va kommunal xizmatlar"
        subtitle="Hokimlik va kommunal xizmatlarga to'g'ridan-to'g'ri murojaat"
        action={<CreateIssueDialog />}
      />

      <div className="px-4 lg:px-6 space-y-4">
        {/* Quick services */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ServiceTile icon={FileText} label="Ma'lumotnoma" />
          <ServiceTile icon={Droplet} label="Suv hisoblagich" />
          <ServiceTile icon={Zap} label="Elektr to'lov" />
          <ServiceTile icon={Landmark} label="Hokimga ariza" />
        </div>

        <div>
          <h2 className="font-display text-lg font-bold mb-3 mt-2">Jamoat muammolari</h2>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-24 animate-pulse bg-muted/40" />)}</div>
          ) : issues.length === 0 ? (
            <EmptyState icon={MapPin} title="Muammolar yo'q" description="Yo'l, suv, elektr yoki boshqa muammoni birinchi bo'lib bildiring." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 pb-6">
              {issues.map((i) => <IssueCard key={i.id} i={i} />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ServiceTile({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return (
    <button className="card-hover flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center"
      onClick={() => toast.info("Ushbu xizmat tez orada qo'shiladi")}>
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function IssueCard({ i }: { i: any }) {
  const tm = TYPE_META[i.type as IssueType] ?? TYPE_META.other;
  const sm = STATUS_META[i.status as keyof typeof STATUS_META];
  const TIcon = tm.icon;
  const SIcon = sm.icon;
  return (
    <Card className="p-4 card-hover">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tm.color}`}>
          <TIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{tm.label}</Badge>
            <span className="text-[11px] text-muted-foreground ml-auto">{timeAgo(i.created_at)}</span>
          </div>
          <p className="mt-1.5 font-bold text-sm leading-snug">{i.title}</p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{i.description}</p>
          {i.address && <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" /> {i.address}</p>}
          <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${sm.cls}`}>
            <SIcon className="h-3 w-3" /> {sm.label}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CreateIssueDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<IssueType>("road");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { error } = await supabase.from("issues").insert({
        type, title, description, address: address || null, reporter_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Muammo qabul qilindi");
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["home-stats"] });
      setOpen(false); setTitle(""); setDescription(""); setAddress("");
    },
    onError: (e: Error) => toast.error(e.message === "auth" ? "Avval tizimga kiring" : e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 bg-accent hover:bg-accent/90 shadow-warm">
          <Plus className="h-4 w-4" />Muammo bildirish
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Yangi muammo</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div><Label className="text-xs">Muammo turi</Label>
            <Select value={type} onValueChange={(v) => setType(v as IssueType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_META).map(([k, m]) => (
                  <SelectItem key={k} value={k}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Qisqacha</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} placeholder="Markaziy ko'chada chuqur" />
          </div>
          <div><Label className="text-xs">Batafsil</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} maxLength={1000} />
          </div>
          <div><Label className="text-xs">Manzil (ixt.)</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Mahalla, ko'cha nomi" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Bekor</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Yuborilmoqda..." : "Yuborish"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
