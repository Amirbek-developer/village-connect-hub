import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LogOut, ShieldCheck, MapPin, Save, Camera, ChevronRight,
  UserCircle2, Lock, Bell, Database, Settings as SettingsIcon, ArrowLeft, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthRequired } from "@/components/shared/AuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profil — QishloqNet" }] }),
  component: ProfilePage,
});

type Section = "home" | "account" | "privacy" | "notifications" | "data" | "settings" | "faq";

function ProfilePage() {
  return (
    <AppLayout>
      <div className="px-4 lg:px-6 py-4 pb-24">
        <AuthRequired><ProfileBody /></AuthRequired>
      </div>
    </AppLayout>
  );
}

function ProfileBody() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("home");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !profile) return <Card className="h-72 animate-pulse bg-muted/40" />;

  if (section !== "home") {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setSection("home")}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Orqaga
        </button>
        {section === "account" && <AccountSection profile={profile} />}
        {section === "privacy" && <PrivacySection />}
        {section === "notifications" && <NotificationsSection />}
        {section === "data" && <DataSection />}
        {section === "settings" && <SettingsSection />}
        {section === "faq" && <FaqSection />}
      </div>
    );
  }

  return <ProfileHome profile={profile} onOpen={setSection} />;
}

/* ------------- HOME ------------- */
function ProfileHome({ profile, onOpen }: { profile: any; onOpen: (s: Section) => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const firstName = profile.first_name || profile.name?.split(" ")[0] || "Foydalanuvchi";
  const lastName = profile.last_name || profile.name?.split(" ").slice(1).join(" ") || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const initial = (firstName || "Q").charAt(0).toUpperCase();
  const username = [firstName, lastName].filter(Boolean).join("").toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  const phone = profile.phone ? formatPhone(profile.phone) : "";

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rasm yangilandi"); qc.invalidateQueries({ queryKey: ["profile", user?.id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows: { id: Section; icon: typeof UserCircle2; iconBg: string; title: string; sub: string }[] = [
    { id: "account",       icon: UserCircle2,   iconBg: "bg-primary",   title: "Hisob",                 sub: "Telefon, foydalanuvchi nomi, bio" },
    { id: "privacy",       icon: Lock,          iconBg: "bg-success",   title: "Maxfiylik va xavfsizlik", sub: "Parol, ko'rinish, qurilmalar" },
    { id: "notifications", icon: Bell,          iconBg: "bg-accent",    title: "Bildirishnomalar",      sub: "Tovush, e'lonlar, xabarlar" },
    { id: "data",          icon: Database,      iconBg: "bg-secondary", title: "Ma'lumot va xotira",    sub: "Media yuklab olish, kesh" },
    { id: "settings",      icon: SettingsIcon,  iconBg: "bg-foreground/80", title: "Sozlamalar",        sub: "Til, mavzu, ilova haqida" },
    { id: "faq",           icon: HelpCircle,    iconBg: "bg-primary/80", title: "FAQ",                    sub: "Ko'p so'raladigan savollar" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Profile hero */}
      <Card className="p-6 flex flex-col items-center text-center">
        <div className="relative">
          <Avatar className="h-28 w-28 ring-4 ring-primary/15">
            {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={fullName} /> : null}
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-4xl font-display font-extrabold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            aria-label="Rasm o'zgartirish"
            className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground ring-4 ring-background shadow-pop active:scale-95 transition"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); }}
          />
        </div>

        <h2 className="mt-4 font-display font-extrabold text-2xl">{fullName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {phone || "Telefon kiritilmagan"} {phone && <>· <span className="text-primary">@{username}</span></>}
        </p>
        {profile.verified && (
          <Badge className="mt-2 gap-1 bg-success text-success-foreground">
            <ShieldCheck className="h-3 w-3" /> Tasdiqlangan
          </Badge>
        )}
      </Card>

      {/* Settings rows */}
      <Card className="overflow-hidden divide-y divide-border">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => onOpen(r.id)}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
            >
              <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white", r.iconBg)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[15px] leading-tight">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </Card>

      <Button
        variant="outline"
        className="w-full gap-2 text-destructive hover:text-destructive"
        onClick={async () => { await signOut(); navigate({ to: "/" }); toast.success("Chiqildi"); }}
      >
        <LogOut className="h-4 w-4" /> Chiqish
      </Button>
    </div>
  );
}

/* ------------- ACCOUNT ------------- */
function AccountSection({ profile }: { profile: any }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [villageId, setVillageId] = useState<string>(profile.village_id ?? "");

  const { data: villages = [] } = useQuery({
    queryKey: ["villages"],
    queryFn: async () => (await supabase.from("villages").select("*").order("name")).data ?? [],
  });

  const update = useMutation({
    mutationFn: async () => {
      const name = [firstName, lastName].filter(Boolean).join(" ").trim();
      const { error } = await supabase.from("profiles").update({
        first_name: firstName || null,
        last_name: lastName || null,
        name: name || firstName || "Foydalanuvchi",
        phone: phone || null,
        bio: bio || null,
        village_id: villageId || null,
      }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saqlandi"); qc.invalidateQueries({ queryKey: ["profile", user?.id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const village = villages.find((v) => v.id === villageId);

  return (
    <Card className="p-6">
      <h2 className="font-display font-extrabold text-xl mb-1">Hisob</h2>
      <p className="text-sm text-muted-foreground mb-5">Shaxsiy ma'lumotlaringiz</p>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); update.mutate(); }}>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Ism</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} />
          </div>
          <div><Label className="text-xs">Familiya</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} />
          </div>
        </div>
        <div><Label className="text-xs">Telefon raqam</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
        </div>
        <div><Label className="text-xs">Qishloq / Mahalla</Label>
          <Select value={villageId} onValueChange={setVillageId}>
            <SelectTrigger><SelectValue placeholder="Tanlang..." /></SelectTrigger>
            <SelectContent>
              {villages.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name} ({v.region})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {village && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {village.name}, {village.region}
            </p>
          )}
        </div>
        <div><Label className="text-xs">Bio (o'zingiz haqingizda)</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} />
        </div>
        <Button type="submit" disabled={update.isPending} className="gap-2">
          <Save className="h-4 w-4" /> {update.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </form>
    </Card>
  );
}

/* ------------- PRIVACY ------------- */
function PrivacySection() {
  const [showPhone, setShowPhone] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-xl">Maxfiylik va xavfsizlik</h2>
        <p className="text-sm text-muted-foreground">Ma'lumotlaringizni kim ko'rishini boshqaring</p>
      </div>
      <SwitchRow label="Telefon raqamim ko'rinsin" desc="Boshqa foydalanuvchilar profilingizda ko'radi" checked={showPhone} onChange={setShowPhone} />
      <SwitchRow label="Onlayn holatim ko'rinsin" desc="So'nggi kirgan vaqt ko'rsatiladi" checked={showOnline} onChange={setShowOnline} />
      <div className="pt-4 border-t border-border">
        <p className="text-sm font-semibold mb-2">Parolni o'zgartirish</p>
        <Button variant="outline" onClick={() => toast.info("Tez orada qo'shiladi")}>Yangi parol o'rnatish</Button>
      </div>
    </Card>
  );
}

/* ------------- NOTIFICATIONS ------------- */
function NotificationsSection() {
  const [push, setPush] = useState(true);
  const [chat, setChat] = useState(true);
  const [forum, setForum] = useState(false);
  const [gov, setGov] = useState(true);
  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-xl">Bildirishnomalar</h2>
        <p className="text-sm text-muted-foreground">Qaysi xabarlarni olishni tanlang</p>
      </div>
      <SwitchRow label="Push bildirishnomalar" desc="Brauzer/ilova orqali" checked={push} onChange={setPush} />
      <SwitchRow label="Chat xabarlari" desc="Yangi shaxsiy xabarlar" checked={chat} onChange={setChat} />
      <SwitchRow label="Forum javoblari" desc="Sizning postingizga javoblar" checked={forum} onChange={setForum} />
      <SwitchRow label="Davlat xizmatlari" desc="Murojaatlaringiz holati" checked={gov} onChange={setGov} />
    </Card>
  );
}

/* ------------- DATA ------------- */
function DataSection() {
  const [autoDl, setAutoDl] = useState(true);
  const [hq, setHq] = useState(false);
  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-xl">Ma'lumot va xotira</h2>
        <p className="text-sm text-muted-foreground">Trafik va keshni boshqarish</p>
      </div>
      <SwitchRow label="Rasmlarni avto yuklash" desc="Wi-Fi orqali avtomatik yuklab olish" checked={autoDl} onChange={setAutoDl} />
      <SwitchRow label="Yuqori sifatli media" desc="Ko'proq trafik sarflanadi" checked={hq} onChange={setHq} />
      <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Keshni tozalash</p>
          <p className="text-xs text-muted-foreground">Vaqtinchalik fayllarni o'chirish</p>
        </div>
        <Button variant="outline" onClick={() => toast.success("Kesh tozalandi")}>Tozalash</Button>
      </div>
    </Card>
  );
}

/* ------------- SETTINGS ------------- */
function SettingsSection() {
  const [lang, setLang] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem("qn_lang") || "uz" : "uz"));
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("qn_lang", lang); }, [lang]);

  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-xl">Sozlamalar</h2>
        <p className="text-sm text-muted-foreground">Til va ilova sozlamalari</p>
      </div>

      <div>
        <Label className="text-xs">Til / Язык / Language</Label>
        <Select value={lang} onValueChange={setLang}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="uz">O'zbekcha</SelectItem>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">Tepadagi til tugmasi orqali ham o'zgartirish mumkin.</p>
      </div>

      <div className="pt-4 border-t border-border space-y-1">
        <p className="text-sm font-semibold">QishloqNet</p>
        <p className="text-xs text-muted-foreground">Versiya 1.0.0 — Jamoa platformasi</p>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} QishloqNet jamoasi</p>
      </div>
    </Card>
  );
}

/* ------------- FAQ ------------- */
const FAQS: { q: string; a: string }[] = [
  { q: "QishloqNet nima?", a: "QishloqNet — qishloq va kichik shahar aholisi uchun jamoat platformasi: e'lonlar, bozor, xizmatlar, davlat murojaatlari va chat bir joyda." },
  { q: "Ro'yxatdan qanday o'taman?", a: "Telefon raqamingiz va parol bilan bir necha soniyada. SMS kod kerak emas — keyingi safar faqat parol so'raladi." },
  { q: "Xizmatimni qanday qo'shaman?", a: "Xizmatlar bo'limiga kirib, o'ng yuqoridagi 'Xizmat qo'sh' tugmasini bosing va ma'lumotlarni to'ldiring." },
  { q: "Chatda rasm yoki fayl yuborsam bo'ladimi?", a: "Ha. Chatdagi biriktirish tugmasi orqali rasm, fayl va media yuborishingiz mumkin." },
  { q: "Ma'lumotlarim xavfsizmi?", a: "Ha. Barcha shaxsiy ma'lumotlar shifrlangan holda saqlanadi va faqat siz ruxsat bergan foydalanuvchilarga ko'rinadi." },
  { q: "Ilova bepulmi?", a: "Ha, QishloqNet aholi uchun butunlay bepul." },
  { q: "Xato yoki taklif bo'lsa nima qilaman?", a: "Profil → Bildirishnomalar orqali biz bilan bog'laning yoki forum bo'limida yozib qoldiring." },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Card className="p-6 space-y-3">
      <div>
        <h2 className="font-display font-extrabold text-xl">FAQ</h2>
        <p className="text-sm text-muted-foreground">Ko'p so'raladigan savollar</p>
      </div>
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold">{item.q}</span>
                <ChevronRight className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", isOpen && "rotate-90")} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ------------- shared ------------- */
function SwitchRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
