import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, AlertTriangle, Calendar, Pin, Heart, Eye } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";

type AnnType = "official" | "public" | "event" | "urgent";

export const Route = createFileRoute("/announcements")({
  head: () => ({ meta: [{ title: "E'lonlar — QishloqNet" }, { name: "description", content: "Rasmiy va ommaviy e'lonlar, tadbirlar, favqulodda holatlar." }] }),
  component: AnnPage,
});

function AnnPage() {
  const [filter, setFilter] = useState<AnnType | "all">("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["announcements", filter],
    queryFn: async () => {
      let q = supabase.from("announcements").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("type", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppLayout>
      <PageHeader
        title="E'lonlar va yangiliklar"
        subtitle="Mahalla, hokimiyat va jamoa habarlari bir joyda"
        action={<CreateAnnDialog />}
      />

      <div className="px-4 lg:px-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as AnnType | "all")}>
          <TabsList className="flex w-full sm:w-auto">
            <TabsTrigger value="all">Hammasi</TabsTrigger>
            <TabsTrigger value="official">Rasmiy</TabsTrigger>
            <TabsTrigger value="public">Ommaviy</TabsTrigger>
            <TabsTrigger value="event">Tadbir</TabsTrigger>
            <TabsTrigger value="urgent">Shoshilinch</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-5 space-y-3 pb-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4 h-28 animate-pulse bg-muted/40" />
            ))
          ) : items.length === 0 ? (
            <EmptyState icon={Megaphone} title="E'lonlar yo'q" description="Birinchi bo'lib o'z e'loningizni qo'shing." />
          ) : (
            items.map((a) => <AnnCard key={a.id} a={a} />)
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function AnnCard({ a }: { a: any }) {
  const typeMap: Record<string, { label: string; cls: string; icon: typeof Megaphone }> = {
    official: { label: "Rasmiy", cls: "bg-primary/10 text-primary border-primary/20", icon: Pin },
    public: { label: "Ommaviy", cls: "bg-secondary/20 text-secondary-foreground border-secondary/30", icon: Megaphone },
    event: { label: "Tadbir", cls: "bg-info/15 text-info border-info/20", icon: Calendar },
    urgent: { label: "Shoshilinch", cls: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
  };
  const meta = typeMap[a.type] ?? typeMap.public;
  const Icon = meta.icon;

  return (
    <Card className={`p-4 sm:p-5 card-hover ${a.is_urgent ? "border-l-4 border-l-destructive" : ""}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.cls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
            {a.is_pinned && <Badge variant="outline" className="text-[10px]"><Pin className="h-2.5 w-2.5 mr-1" />Mahkamlangan</Badge>}
            <span className="text-[11px] text-muted-foreground ml-auto">{timeAgo(a.created_at)}</span>
          </div>
          <h3 className="mt-2 font-display font-bold text-base sm:text-lg leading-snug text-balance">{a.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{a.content}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {a.views}</span>
            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {a.likes}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CreateAnnDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<AnnType>("public");
  const [isUrgent, setIsUrgent] = useState(false);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { error } = await supabase.from("announcements").insert({
        title, content, type, is_urgent: isUrgent || type === "urgent", author_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("E'lon qo'shildi");
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["home-stats"] });
      qc.invalidateQueries({ queryKey: ["home-latest-ann"] });
      setOpen(false); setTitle(""); setContent(""); setType("public"); setIsUrgent(false);
    },
    onError: (e: Error) => {
      if (e.message === "auth") toast.error("Avval tizimga kiring");
      else toast.error("Xatolik: " + e.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 shadow-warm" onClick={() => { if (!user) { toast.error("Avval tizimga kiring"); return; } }}>
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Yangi e'lon</span><span className="sm:hidden">E'lon</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Yangi e'lon</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div>
            <Label className="text-xs">Turi</Label>
            <Select value={type} onValueChange={(v) => setType(v as AnnType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Ommaviy</SelectItem>
                <SelectItem value="official">Rasmiy</SelectItem>
                <SelectItem value="event">Tadbir</SelectItem>
                <SelectItem value="urgent">Shoshilinch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Sarlavha</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
          </div>
          <div>
            <Label className="text-xs">Matn</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={5} maxLength={2000} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
            Shoshilinch xabar
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
