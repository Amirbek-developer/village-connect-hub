import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessagesSquare, Plus, ArrowUp, MessageCircle, Eye } from "lucide-react";
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
import { timeAgo } from "@/lib/format";

const CATS = [
  { value: "general", label: "Umumiy" },
  { value: "qa", label: "Savol-javob" },
  { value: "volunteer", label: "Ko'ngillilar" },
  { value: "complaint", label: "Shikoyat" },
  { value: "help", label: "Qo'shni yordam" },
];

export const Route = createFileRoute("/forum")({
  head: () => ({ meta: [{ title: "Jamoa muhokamasi — QishloqNet" }, { name: "description", content: "Qishloq ahli o'rtasida erkin muloqot va g'oyalar." }] }),
  component: ForumPage,
});

function ForumPage() {
  const [cat, setCat] = useState("all");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["forum", cat],
    queryFn: async () => {
      let q = supabase.from("forum_posts").select("*").order("created_at", { ascending: false });
      if (cat !== "all") q = q.eq("category", cat);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppLayout>
      <PageHeader title="Jamoa muhokamasi" subtitle="Erkin muloqot, savol-javob va takliflar" action={<CreatePostDialog />} />

      <div className="px-4 lg:px-6 space-y-4 pb-6">
        <Tabs value={cat} onValueChange={setCat}>
          <TabsList className="flex flex-wrap h-auto w-full sm:w-auto">
            <TabsTrigger value="all">Hammasi</TabsTrigger>
            {CATS.map((c) => <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-24 animate-pulse bg-muted/40" />)}</div>
        ) : posts.length === 0 ? (
          <EmptyState icon={MessagesSquare} title="Hali muhokamalar yo'q" description="Birinchi bo'lib mavzu boshlang." />
        ) : (
          <div className="space-y-3">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </AppLayout>
  );
}

function PostCard({ p }: { p: any }) {
  const catLabel = CATS.find((c) => c.value === p.category)?.label ?? p.category;
  return (
    <Card className="p-4 card-hover">
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <button className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 px-2.5 py-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition">
          <ArrowUp className="h-4 w-4" />
          <span className="text-xs font-bold">{p.upvotes}</span>
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">{catLabel}</Badge>
            <span className="text-[11px] text-muted-foreground ml-auto">{timeAgo(p.created_at)}</span>
          </div>
          <p className="mt-1.5 font-display font-bold leading-snug">{p.title}</p>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{p.content}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {p.comment_count}</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {p.views}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CreatePostDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { error } = await supabase.from("forum_posts").insert({
        title, content, category, author_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post qo'shildi");
      qc.invalidateQueries({ queryKey: ["forum"] });
      setOpen(false); setTitle(""); setContent(""); setCategory("general");
    },
    onError: (e: Error) => toast.error(e.message === "auth" ? "Avval tizimga kiring" : e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 shadow-warm"><Plus className="h-4 w-4" />Yangi post</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Yangi muhokama</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div><Label className="text-xs">Bo'lim</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Sarlavha</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
          </div>
          <div><Label className="text-xs">Matn</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={5} maxLength={2000} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Bekor</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saqlanmoqda..." : "E'lon qilish"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
