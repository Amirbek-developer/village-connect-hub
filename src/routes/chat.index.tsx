import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, Plus, Users, Radio, User as UserIcon, X, Check } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { AuthRequired } from "@/components/shared/AuthGuard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import {
  Conversation,
  ProfileLite,
  createGroupOrChannel,
  displayName,
  fetchMyConversations,
  fetchProfilesByIds,
  getOrCreateDm,
  initials,
  searchProfiles,
} from "@/lib/chat";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat/")({
  head: () => ({ meta: [{ title: "Chat — QishloqNet" }] }),
  component: ChatIndexPage,
});

function ChatIndexPage() {
  return (
    <AppLayout>
      <AuthRequired>
        <ChatList />
      </AuthRequired>
    </AppLayout>
  );
}

function ChatList() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [participants, setParticipants] = useState<Record<string, string[]>>({});
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "dm" | "group" | "channel">("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { list } = await fetchMyConversations(user.id);
    setConvs(list);

    // Gather DM peer ids
    const dmIds = list.filter((c) => c.type === "dm").map((c) => c.id);
    if (dmIds.length) {
      const { data } = await supabase
        .from("conversation_participants")
        .select("conversation_id,user_id")
        .in("conversation_id", dmIds);
      const byConv: Record<string, string[]> = {};
      const peerIds: string[] = [];
      (data ?? []).forEach((r) => {
        byConv[r.conversation_id] = [...(byConv[r.conversation_id] ?? []), r.user_id];
        if (r.user_id !== user.id) peerIds.push(r.user_id);
      });
      setParticipants(byConv);
      const map = await fetchProfilesByIds(Array.from(new Set(peerIds)));
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("chat-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_participants" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    return convs.filter((c) => {
      if (tab !== "all" && c.type !== tab) return false;
      if (!q.trim()) return true;
      const label = convLabel(c, user!.id, participants, profiles).toLowerCase();
      return label.includes(q.trim().toLowerCase());
    });
  }, [convs, tab, q, participants, profiles, user]);

  return (
    <>
      <PageHeader
        title="Chat"
        subtitle="Suhbatlar, guruhlar va kanallar"
        action={<NewChatMenu onDone={load} />}
      />
      <div className="px-4 lg:px-6 pb-24 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suhbat qidirish..."
            className="pl-9"
          />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">Hammasi</TabsTrigger>
            <TabsTrigger value="dm">Shaxsiy</TabsTrigger>
            <TabsTrigger value="group">Guruhlar</TabsTrigger>
            <TabsTrigger value="channel">Kanallar</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>
            ) : filtered.length === 0 ? (
              <EmptyChat />
            ) : (
              <ul className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
                {filtered.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conv={c}
                    meId={user!.id}
                    participants={participants}
                    profiles={profiles}
                  />
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function convLabel(
  c: Conversation,
  meId: string,
  participants: Record<string, string[]>,
  profiles: Record<string, ProfileLite>
): string {
  if (c.type === "dm") {
    const peer = (participants[c.id] ?? []).find((u) => u !== meId);
    return displayName(peer ? profiles[peer] : null);
  }
  return c.title || (c.type === "channel" ? "Kanal" : "Guruh");
}

function ConversationRow({
  conv,
  meId,
  participants,
  profiles,
}: {
  conv: Conversation;
  meId: string;
  participants: Record<string, string[]>;
  profiles: Record<string, ProfileLite>;
}) {
  const label = convLabel(conv, meId, participants, profiles);
  const peer = conv.type === "dm" ? (participants[conv.id] ?? []).find((u) => u !== meId) : undefined;
  const avatar = conv.type === "dm" ? (peer ? profiles[peer]?.avatar_url : null) : conv.avatar_url;

  const Icon = conv.type === "channel" ? Radio : conv.type === "group" ? Users : UserIcon;

  return (
    <li>
      <Link
        to="/chat/$conversationId"
        params={{ conversationId: conv.id }}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="relative shrink-0">
          {avatar ? (
            <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div
              className={cn(
                "h-12 w-12 rounded-full grid place-items-center font-semibold",
                conv.type === "channel"
                  ? "bg-accent/20 text-accent-foreground"
                  : conv.type === "group"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {conv.type === "dm" ? initials(label) : <Icon className="h-5 w-5" />}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{label}</p>
            {conv.type !== "dm" && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0.5">
                {conv.type === "channel" ? "Kanal" : "Guruh"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {conv.description || (conv.type === "dm" ? "Shaxsiy suhbat" : "Bosing va o'qing")}
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(conv.last_message_at)}</span>
      </Link>
    </li>
  );
}

function EmptyChat() {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <MessageCircle className="h-8 w-8" />
      </div>
      <h3 className="mt-4 font-display font-extrabold text-lg">Hali suhbatlar yo'q</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        Yangi suhbat, guruh yoki kanal boshlash uchun tepadagi <b>+</b> tugmasini bosing.
      </p>
    </Card>
  );
}

/* ---------------- New chat menu ---------------- */

function NewChatMenu({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<null | "dm" | "group" | "channel">(null);
  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setMode("dm")}>
          <UserIcon className="h-4 w-4" /> Shaxsiy
        </Button>
        <Button size="sm" variant="outline" onClick={() => setMode("group")}>
          <Users className="h-4 w-4" /> Guruh
        </Button>
        <Button size="sm" onClick={() => setMode("channel")}>
          <Plus className="h-4 w-4" /> Kanal
        </Button>
      </div>
      <NewDmDialog open={mode === "dm"} onOpenChange={(o) => !o && setMode(null)} onDone={onDone} />
      <NewGroupDialog
        open={mode === "group" || mode === "channel"}
        type={mode === "channel" ? "channel" : "group"}
        onOpenChange={(o) => !o && setMode(null)}
        onDone={onDone}
      />
    </>
  );
}

function NewDmDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProfileLite[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const h = setTimeout(async () => {
      const r = await searchProfiles(q, user.id);
      setResults(r);
    }, 250);
    return () => clearTimeout(h);
  }, [q, open, user]);

  const startDm = async (peer: ProfileLite) => {
    if (!user) return;
    setBusy(true);
    try {
      const id = await getOrCreateDm(user.id, peer.id);
      onDone();
      onOpenChange(false);
      navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
    } catch (e: any) {
      toast({ title: "Xato", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi shaxsiy suhbat</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ism yoki telefon bo'yicha qidirish..."
              className="pl-9"
            />
          </div>
          <ul className="max-h-72 overflow-auto divide-y divide-border rounded-xl border border-border">
            {results.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">
                {q.trim() ? "Hech kim topilmadi" : "Ism yoki telefon yozing"}
              </li>
            ) : (
              results.map((p) => (
                <li key={p.id}>
                  <button
                    disabled={busy}
                    onClick={() => startDm(p)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 text-left"
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs font-semibold">
                        {initials(displayName(p))}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{displayName(p)}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.phone}</p>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewGroupDialog({
  open,
  onOpenChange,
  onDone,
  type,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
  type: "group" | "channel";
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProfileLite[]>([]);
  const [members, setMembers] = useState<ProfileLite[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDesc("");
      setQ("");
      setResults([]);
      setMembers([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !user) return;
    const h = setTimeout(async () => {
      const r = await searchProfiles(q, user.id);
      setResults(r);
    }, 250);
    return () => clearTimeout(h);
  }, [q, open, user]);

  const toggle = (p: ProfileLite) => {
    setMembers((m) => (m.find((x) => x.id === p.id) ? m.filter((x) => x.id !== p.id) : [...m, p]));
  };

  const submit = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast({ title: "Nomi kerak", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const id = await createGroupOrChannel(
        user.id,
        type,
        title.trim(),
        desc.trim() || null,
        members.map((m) => m.id)
      );
      onDone();
      onOpenChange(false);
      navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
    } catch (e: any) {
      toast({
        title: "Xato",
        description:
          type === "channel"
            ? "Kanal yaratish uchun ruxsat yo'q (faqat administratorlar) yoki: " + (e.message ?? String(e))
            : e.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{type === "channel" ? "Yangi kanal" : "Yangi guruh"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nomi" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            placeholder="Tavsif (ixtiyoriy)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
          />
          {members.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-1"
                >
                  {displayName(m)}
                  <button onClick={() => toggle(m)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="A'zolarni qo'shish..."
              className="pl-9"
            />
          </div>
          <ul className="max-h-56 overflow-auto divide-y divide-border rounded-xl border border-border">
            {results.map((p) => {
              const active = !!members.find((x) => x.id === p.id);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => toggle(p)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 text-left"
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs font-semibold">
                        {initials(displayName(p))}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{displayName(p)}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.phone}</p>
                    </div>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Yaratilmoqda..." : type === "channel" ? "Kanal yaratish" : "Guruh yaratish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
