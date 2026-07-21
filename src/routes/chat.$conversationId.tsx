import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Image as ImageIcon,
  File as FileIcon,
  Users,
  Radio,
  User as UserIcon,
  Trash2,
  Download,
} from "lucide-react";
import { AuthRequired } from "@/components/shared/AuthGuard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Conversation,
  Message,
  ProfileLite,
  Participant,
  deleteMessage,
  displayName,
  fetchMessages,
  fetchParticipants,
  fetchProfilesByIds,
  initials,
  joinChannel,
  markRead,
  sendTextMessage,
  uploadAndSendMedia,
} from "@/lib/chat";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat/$conversationId")({
  head: () => ({ meta: [{ title: "Suhbat — QishloqNet" }] }),
  component: ChatDetailPage,
});

function ChatDetailPage() {
  return (
    <AuthRequired>
      <ChatDetail />
    </AuthRequired>
  );
}

function ChatDetail() {
  const { conversationId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isParticipant = !!participants.find((p) => p.user_id === user?.id);
  const myRole = participants.find((p) => p.user_id === user?.id)?.role;
  const canSend =
    isParticipant && (conv?.type !== "channel" || myRole === "owner" || myRole === "admin");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: c } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();
      if (cancelled) return;
      if (!c) {
        setLoading(false);
        return;
      }
      setConv(c as Conversation);
      const parts = await fetchParticipants(conversationId);
      setParticipants(parts);
      const profileIds = Array.from(new Set(parts.map((p) => p.user_id)));
      const pmap = await fetchProfilesByIds(profileIds);
      setProfiles(pmap);
      const msgs = await fetchMessages(conversationId);
      setMessages(msgs);
      setLoading(false);
      if (user) markRead(user.id, conversationId);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, user?.id]);

  // Realtime messages
  useEffect(() => {
    const ch = supabase
      .channel(`msg:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.find((x) => x.id === m.id) ? prev : [...prev, m]));
          if (!profiles[m.sender_id]) {
            const extra = await fetchProfilesByIds([m.sender_id]);
            setProfiles((p) => ({ ...p, ...extra }));
          }
          if (user) markRead(user.id, conversationId);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (loading) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>;
  }
  if (!conv) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Suhbat topilmadi</p>
        <Button asChild variant="outline" className="mt-3">
          <Link to="/chat">Orqaga</Link>
        </Button>
      </div>
    );
  }

  const headerLabel = titleOf(conv, user?.id ?? "", participants, profiles);
  const headerSub =
    conv.type === "dm"
      ? profiles[participants.find((p) => p.user_id !== user?.id)?.user_id ?? ""]?.phone ?? ""
      : `${participants.length} a'zo`;
  const HeaderIcon = conv.type === "channel" ? Radio : conv.type === "group" ? Users : UserIcon;

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-3 py-2 bg-card">
        <Button size="icon" variant="ghost" onClick={() => navigate({ to: "/chat" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-10 w-10 rounded-full bg-muted grid place-items-center shrink-0">
          {conv.type === "dm" ? (
            <span className="text-sm font-semibold">{initials(headerLabel)}</span>
          ) : (
            <HeaderIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{headerLabel}</p>
          <p className="text-xs text-muted-foreground truncate">{headerSub}</p>
        </div>
        {conv.type !== "dm" && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0.5">
            {conv.type === "channel" ? "Kanal" : "Guruh"}
          </span>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 bg-muted/30">
        {messages.length === 0 ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            Xabarlar hali yo'q. Birinchi bo'lib yozing.
          </div>
        ) : (
          <ul className="space-y-2 max-w-3xl mx-auto">
            {messages.map((m, idx) => {
              const mine = m.sender_id === user?.id;
              const prev = messages[idx - 1];
              const showAvatar = !mine && (!prev || prev.sender_id !== m.sender_id);
              const sender = profiles[m.sender_id];
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  mine={mine}
                  sender={sender}
                  showAvatar={showAvatar}
                  showName={showAvatar && conv.type !== "dm"}
                  canDelete={mine || myRole === "owner" || myRole === "admin"}
                />
              );
            })}
          </ul>
        )}
      </div>

      {/* Composer */}
      {canSend ? (
        <Composer conversationId={conv.id} />
      ) : conv.type === "channel" && !isParticipant ? (
        <div className="border-t border-border p-3 bg-card">
          <Button
            className="w-full"
            onClick={async () => {
              if (!user) return;
              await joinChannel(user.id, conv.id);
              const parts = await fetchParticipants(conv.id);
              setParticipants(parts);
            }}
          >
            Kanalga a'zo bo'lish
          </Button>
        </div>
      ) : (
        <div className="border-t border-border p-3 bg-card text-center text-sm text-muted-foreground">
          {conv.type === "channel" ? "Faqat administratorlar xabar yubora oladi" : "Xabar yuborish uchun ruxsat yo'q"}
        </div>
      )}
    </div>
  );
}

function titleOf(
  c: Conversation,
  meId: string,
  parts: Participant[],
  profiles: Record<string, ProfileLite>
) {
  if (c.type === "dm") {
    const peer = parts.find((p) => p.user_id !== meId);
    return displayName(peer ? profiles[peer.user_id] : null);
  }
  return c.title || (c.type === "channel" ? "Kanal" : "Guruh");
}

function MessageBubble({
  message,
  mine,
  sender,
  showAvatar,
  showName,
  canDelete,
}: {
  message: Message;
  mine: boolean;
  sender?: ProfileLite;
  showAvatar: boolean;
  showName: boolean;
  canDelete: boolean;
}) {
  const time = new Date(message.created_at).toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDelete = async () => {
    if (!confirm("Xabarni o'chirasizmi?")) return;
    try {
      await deleteMessage(message.id);
    } catch (e: any) {
      toast({ title: "Xato", description: e.message ?? String(e), variant: "destructive" });
    }
  };

  return (
    <li className={cn("flex gap-2 group", mine ? "justify-end" : "justify-start")}>
      {!mine && (
        <div className="w-8 shrink-0">
          {showAvatar &&
            (sender?.avatar_url ? (
              <img src={sender.avatar_url} className="h-8 w-8 rounded-full object-cover" alt="" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-[10px] font-semibold">
                {initials(displayName(sender))}
              </div>
            ))}
        </div>
      )}
      <div className={cn("max-w-[75%] flex flex-col", mine ? "items-end" : "items-start")}>
        {showName && (
          <span className="text-[11px] font-medium text-primary px-1 mb-0.5">{displayName(sender)}</span>
        )}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm shadow-sm break-words",
            mine
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md"
          )}
        >
          {message.kind === "image" && message.media_url && (
            <a href={message.media_url} target="_blank" rel="noreferrer" className="block mb-1">
              <img
                src={message.media_url}
                alt={message.media_name ?? ""}
                className="rounded-lg max-h-72 object-cover"
              />
            </a>
          )}
          {message.kind === "file" && message.media_url && (
            <a
              href={message.media_url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-2",
                mine ? "bg-primary-foreground/10" : "bg-muted"
              )}
            >
              <FileIcon className="h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{message.media_name}</p>
                {message.media_size != null && (
                  <p className="text-[10px] opacity-70">{(message.media_size / 1024).toFixed(1)} KB</p>
                )}
              </div>
              <Download className="h-4 w-4 opacity-70" />
            </a>
          )}
          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
          <div className={cn("mt-1 text-[10px] flex items-center gap-2", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
            <span>{time}</span>
            {canDelete && (
              <button
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="O'chirish"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Composer({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const send = async () => {
    if (!user || !text.trim() || sending) return;
    setSending(true);
    const v = text.trim();
    setText("");
    try {
      await sendTextMessage(user.id, conversationId, v);
    } catch (e: any) {
      toast({ title: "Xato", description: e.message ?? String(e), variant: "destructive" });
      setText(v);
    } finally {
      setSending(false);
    }
  };

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Fayl juda katta", description: "Maksimal 20MB", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await uploadAndSendMedia(user.id, conversationId, file);
    } catch (e: any) {
      toast({ title: "Yuklashda xato", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border bg-card p-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="flex items-end gap-1.5 max-w-3xl mx-auto">
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <Button size="icon" variant="ghost" onClick={() => imgRef.current?.click()} disabled={sending}>
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} disabled={sending}>
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Xabar yozing..."
          rows={1}
          className="flex-1 resize-none min-h-[40px] max-h-32 py-2"
        />
        <Button size="icon" onClick={send} disabled={sending || !text.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
