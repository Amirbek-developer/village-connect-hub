import { supabase } from "@/integrations/supabase/client";

export type ConversationType = "dm" | "group" | "channel";
export type ParticipantRole = "owner" | "admin" | "member";
export type MessageKind = "text" | "image" | "file";

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  last_message_at: string;
  created_at: string;
}

export interface Participant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  last_read_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  kind: MessageKind;
  content: string | null;
  media_url: string | null;
  media_name: string | null;
  media_size: number | null;
  media_mime: string | null;
  created_at: string;
}

export interface ProfileLite {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

/** Fetch conversations the current user participates in, plus public channels. */
export async function fetchMyConversations(userId: string) {
  // Own conversations (via participants)
  const { data: mine, error: e1 } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);
  if (e1) throw e1;

  const ids = (mine ?? []).map((r) => r.conversation_id);
  const lastReadMap = new Map((mine ?? []).map((r) => [r.conversation_id, r.last_read_at]));

  const { data: mineConvs, error: e2 } = ids.length
    ? await supabase.from("conversations").select("*").in("id", ids)
    : { data: [] as Conversation[], error: null };
  if (e2) throw e2;

  const { data: channels, error: e3 } = await supabase
    .from("conversations")
    .select("*")
    .eq("type", "channel");
  if (e3) throw e3;

  const merged = new Map<string, Conversation>();
  [...(mineConvs ?? []), ...(channels ?? [])].forEach((c) => merged.set(c.id, c as Conversation));
  const list = Array.from(merged.values()).sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );
  return { list, lastReadMap };
}

export async function fetchParticipants(conversationId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("*")
    .eq("conversation_id", conversationId);
  if (error) throw error;
  return (data ?? []) as Participant[];
}

export async function fetchProfilesByIds(ids: string[]): Promise<Record<string, ProfileLite>> {
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,first_name,last_name,phone,avatar_url")
    .in("id", ids);
  if (error) throw error;
  const map: Record<string, ProfileLite> = {};
  (data ?? []).forEach((p) => (map[p.id] = p as ProfileLite));
  return map;
}

export async function fetchMessages(conversationId: string, limit = 100): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Message[]).reverse();
}

export async function searchProfiles(q: string, excludeUserId: string): Promise<ProfileLite[]> {
  const term = q.trim();
  if (!term) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,first_name,last_name,phone,avatar_url")
    .or(`name.ilike.%${term}%,phone.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
    .neq("id", excludeUserId)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as ProfileLite[];
}

/** Find or create a DM conversation between two users. */
export async function getOrCreateDm(userId: string, otherUserId: string): Promise<string> {
  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  const { data: theirs } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", otherUserId);
  const mineIds = new Set((mine ?? []).map((r) => r.conversation_id));
  const shared = (theirs ?? []).map((r) => r.conversation_id).filter((id) => mineIds.has(id));

  if (shared.length) {
    const { data: dm } = await supabase
      .from("conversations")
      .select("id,type")
      .in("id", shared)
      .eq("type", "dm")
      .limit(1)
      .maybeSingle();
    if (dm) return dm.id;
  }

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({ type: "dm", created_by: userId })
    .select("id")
    .single();
  if (error) throw error;

  const { error: pErr } = await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: userId, role: "owner" },
    { conversation_id: conv.id, user_id: otherUserId, role: "member" },
  ]);
  if (pErr) throw pErr;
  return conv.id;
}

export async function createGroupOrChannel(
  userId: string,
  type: "group" | "channel",
  title: string,
  description: string | null,
  memberIds: string[]
): Promise<string> {
  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({ type, title, description, created_by: userId })
    .select("id")
    .single();
  if (error) throw error;

  const rows = [
    { conversation_id: conv.id, user_id: userId, role: "owner" as ParticipantRole },
    ...memberIds
      .filter((id) => id !== userId)
      .map((id) => ({ conversation_id: conv.id, user_id: id, role: "member" as ParticipantRole })),
  ];
  const { error: pErr } = await supabase.from("conversation_participants").insert(rows);
  if (pErr) throw pErr;
  return conv.id;
}

export async function joinChannel(userId: string, conversationId: string) {
  const { error } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conversationId, user_id: userId, role: "member" });
  if (error && !String(error.message).includes("duplicate")) throw error;
}

export async function sendTextMessage(userId: string, conversationId: string, text: string) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    kind: "text",
    content: text,
  });
  if (error) throw error;
}

export async function uploadAndSendMedia(
  userId: string,
  conversationId: string,
  file: File
) {
  const isImage = file.type.startsWith("image/");
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${conversationId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage.from("chat-media").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
  });
  if (upErr) throw upErr;

  const { data: signed } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 60 * 24 * 365);
  const url = signed?.signedUrl ?? path;

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    kind: isImage ? "image" : "file",
    content: null,
    media_url: url,
    media_name: file.name,
    media_size: file.size,
    media_mime: file.type,
  });
  if (error) throw error;
}

export async function markRead(userId: string, conversationId: string) {
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) throw error;
}

export function displayName(p?: ProfileLite | null): string {
  if (!p) return "Foydalanuvchi";
  const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return full || p.name || p.phone || "Foydalanuvchi";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}
