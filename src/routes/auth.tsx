import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Lock, Phone, User, MapPin, Calendar as CalIcon,
  ArrowRight, ArrowLeft, Camera, ImagePlus, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  isValidUzPhone, normalizePhone, formatPhone, phoneToEmail, formatPhoneInput,
  LAST_PHONE_KEY, VISITED_KEY,
} from "@/lib/phone";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" || s.mode === "signin" ? s.mode : undefined,
  }),
  head: () => ({ meta: [
    { title: "Kirish — QishloqNet" },
    { name: "description", content: "QishloqNet — qishloq jamoasiga qo'shiling." },
  ] }),
  component: AuthPage,
});

function capitalize(s: string) {
  const t = (s || "").trim();
  if (!t) return t;
  return t.charAt(0).toLocaleUpperCase("uz") + t.slice(1).toLocaleLowerCase("uz");
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const search = Route.useSearch();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Remembered phone — if present, default to "signin only password" mode
  const remembered = typeof window !== "undefined" ? localStorage.getItem(LAST_PHONE_KEY) : null;
  const initialMode: "signin" | "signup" =
    search.mode ?? (remembered ? "signin" : "signup");
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);

  // Post-signup avatar step
  const [step, setStep] = useState<"form" | "avatar">("form");

  useEffect(() => {
    if (!loading && user && pathname === "/auth" && step === "form") {
      // Already signed in — go home
      navigate({ to: "/" });
    }
  }, [user, loading, navigate, pathname, step]);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground items-center justify-center p-12">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="relative max-w-md">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-background/15 backdrop-blur font-display font-extrabold text-2xl">Q</div>
          <h1 className="mt-6 font-display text-4xl font-extrabold text-balance leading-tight">Qishlog'ingiz bir bosishda</h1>
          <p className="mt-4 text-primary-foreground/90 text-balance">
            QishloqNet — sizning mahallangiz, qishlog'ingiz uchun yaratilgan platforma.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-primary-foreground/80">
            <li>✓ Mahalliy bozor va fermer mahsulotlari</li>
            <li>✓ Yo'l, suv, gaz muammolarini hokimlikka yetkazish</li>
            <li>✓ Tasdiqlangan usta va xizmat ko'rsatuvchilar</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md p-6 sm:p-8 shadow-warm border-border/60">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-extrabold">Q</div>
            <div>
              <p className="font-display text-lg font-extrabold leading-none">QishloqNet</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Jamoa platformasi</p>
            </div>
          </div>

          {step === "avatar" ? (
            <AvatarStep onDone={() => navigate({ to: "/" })} />
          ) : mode === "signup" ? (
            <SignUpForm
              switchToSignIn={() => setMode("signin")}
              onSuccess={() => setStep("avatar")}
            />
          ) : (
            <SignInForm
              remembered={remembered}
              switchToSignUp={() => setMode("signup")}
              onSuccess={() => navigate({ to: "/" })}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

/* ──────────────── SIGN UP ──────────────── */
function SignUpForm({ switchToSignIn, onSuccess }: {
  switchToSignIn: () => void;
  onSuccess: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [villageId, setVillageId] = useState<string>("");
  const [phone, setPhone] = useState("+998 ");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [joinedDate, setJoinedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  const { data: villages = [] } = useQuery({
    queryKey: ["villages"],
    queryFn: async () => (await supabase.from("villages").select("id,name,region").order("name")).data ?? [],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fn = capitalize(firstName);
    const ln = capitalize(lastName);
    if (!fn || !ln) return toast.error("Ism va familiyani kiriting");
    if (!villageId) return toast.error("Qishloqni tanlang");
    if (!isValidUzPhone(phone)) return toast.error("Telefon raqam noto'g'ri (+998 …)");
    if (password.length < 8) return toast.error("Parol kamida 8 belgi bo'lsin");
    if (!birthDate) return toast.error("Tug'ilgan sanani kiriting");

    setBusy(true);
    const email = phoneToEmail(phone);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: fn, last_name: ln,
          full_name: `${fn} ${ln}`,
          phone: normalizePhone(phone),
          village_id: villageId,
          birth_date: birthDate,
          joined_date: joinedDate,
        },
      },
    });
    setBusy(false);
    if (error) {
      if (/already|registered/i.test(error.message)) toast.error("Bu telefon raqam allaqachon ro'yxatda — kiring");
      else toast.error(error.message);
      return;
    }
    localStorage.setItem(LAST_PHONE_KEY, normalizePhone(phone));
    localStorage.setItem(VISITED_KEY, "1");
    toast.success(`Xush kelibsiz, ${fn}!`);
    onSuccess();
  }

  return (
    <>
      <h2 className="font-display text-2xl font-extrabold">Ro'yxatdan o'tish</h2>
      <p className="mt-1 text-sm text-muted-foreground">QishloqNet jamoasiga qo'shiling</p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field id="su-fn" label="Ism" icon={User} value={firstName} onChange={setFirstName} required placeholder="Anvar" />
          <Field id="su-ln" label="Familiya" icon={User} value={lastName} onChange={setLastName} required placeholder="Karimov" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Qishloq</Label>
          <Select value={villageId} onValueChange={setVillageId}>
            <SelectTrigger className="h-11">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Qishloqni tanlang" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {villages.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Field id="su-phone" label="Telefon raqam" icon={Phone} type="tel" value={phone} onChange={(v) => setPhone(formatPhoneInput(v))} required placeholder="+998 90 123 45 67" />
        <Field id="su-pw" label="Parol (kamida 8 belgi)" icon={Lock} type="password" value={password} onChange={setPassword} required />

        <div className="grid grid-cols-2 gap-3">
          <Field id="su-bd" label="Tug'ilgan sana" icon={CalIcon} type="date" value={birthDate} onChange={setBirthDate} required />
          <Field id="su-jd" label="A'zo bo'lgan sana" icon={CalIcon} type="date" value={joinedDate} onChange={setJoinedDate} required />
        </div>

        <Button type="submit" disabled={busy} className="w-full h-11 gap-2 bg-accent hover:bg-accent/90">
          {busy ? "Yaratilmoqda..." : <>Davom etish <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Hisobingiz bormi?{" "}
        <button type="button" onClick={switchToSignIn} className="font-semibold text-primary hover:underline">
          Kirish
        </button>
      </p>
    </>
  );
}

/* ──────────────── SIGN IN ──────────────── */
function SignInForm({ remembered, switchToSignUp, onSuccess }: {
  remembered: string | null;
  switchToSignUp: () => void;
  onSuccess: () => void;
}) {
  const [phone, setPhone] = useState(remembered ? formatPhone(remembered) : "+998 ");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [editPhone, setEditPhone] = useState(!remembered);



  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidUzPhone(phone)) return toast.error("Telefon raqam noto'g'ri");
    if (!password) return toast.error("Parolni kiriting");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone), password,
    });
    setBusy(false);
    if (error) {
      toast.error("Telefon yoki parol noto'g'ri");
      return;
    }
    localStorage.setItem(LAST_PHONE_KEY, normalizePhone(phone));
    localStorage.setItem(VISITED_KEY, "1");
    toast.success("Xush kelibsiz!");
    onSuccess();
  }

  const displayPhone = remembered ? formatPhone(remembered) : "";

  return (
    <>
      <h2 className="font-display text-2xl font-extrabold">Xush kelibsiz</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {remembered && !editPhone ? "Davom etish uchun parolni kiriting" : "Telefon va parol bilan kiring"}
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        {remembered && !editPhone ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-display font-bold">
                {(displayPhone).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{displayPhone}</p>
              <button type="button" onClick={() => { setEditPhone(true); setPhone(""); localStorage.removeItem(LAST_PHONE_KEY); }}
                className="text-xs text-primary hover:underline">
                Bu siz emasmi?
              </button>
            </div>
          </div>
        ) : (
          <Field id="si-phone" label="Telefon raqam" icon={Phone} type="tel" value={phone} onChange={(v) => setPhone(formatPhoneInput(v))} required placeholder="+998 90 123 45 67" />
        )}

        <Field id="si-pw" label="Parol" icon={Lock} type="password" value={password} onChange={setPassword} required autoFocus={!!remembered && !editPhone} />

        <Button type="submit" disabled={busy} className="w-full h-11 gap-2">
          {busy ? "Tekshirilmoqda..." : <>Kirish <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Hisobingiz yo'qmi?{" "}
        <button type="button" onClick={switchToSignUp} className="font-semibold text-primary hover:underline">
          Ro'yxatdan o'ting
        </button>
      </p>
    </>
  );
}

/* ──────────────── AVATAR STEP ──────────────── */
function AvatarStep({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-onboard", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("first_name,name").eq("id", user!.id).maybeSingle()).data,
  });

  const initial = capitalize(profile?.first_name ?? profile?.name ?? "Q").charAt(0);

  function pick(f: File) {
    if (!f.type.startsWith("image/")) return toast.error("Faqat rasm yuklang");
    if (f.size > 5 * 1024 * 1024) return toast.error("Rasm 5 MB dan oshmasin");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file || !user) return;
    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setBusy(false); return toast.error(upErr.message); }
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    const url = signed?.signedUrl ?? null;
    const { error: uErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setBusy(false);
    if (uErr) return toast.error(uErr.message);
    toast.success("Profil rasmi saqlandi");
    onDone();
  }

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-success" /> Hisob yaratildi
      </div>
      <h2 className="mt-2 font-display text-2xl font-extrabold">Profil rasmingiz</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Jamoadagilar sizni tanishi uchun bitta rasm qo'shing. Istamasangiz — keyinroq.
      </p>

      <div className="mt-6 flex flex-col items-center">
        <Avatar className="h-32 w-32 ring-4 ring-primary/15">
          {preview ? <AvatarImage src={preview} alt="Avatar" /> : null}
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-5xl font-display font-extrabold">
            {initial}
          </AvatarFallback>
        </Avatar>

        <input
          ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }}
        />

        <div className="mt-5 flex w-full flex-col gap-2">
          {!preview ? (
            <Button type="button" onClick={() => fileRef.current?.click()} className="w-full h-11 gap-2">
              <ImagePlus className="h-4 w-4" /> Rasm tanlash
            </Button>
          ) : (
            <>
              <Button type="button" onClick={upload} disabled={busy} className="w-full h-11 gap-2">
                <Camera className="h-4 w-4" /> {busy ? "Yuklanmoqda..." : "Saqlash"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setFile(null); setPreview(null); }} className="w-full h-11">
                Boshqasini tanlash
              </Button>
            </>
          )}

          <Button type="button" variant="ghost" onClick={onDone} className="w-full h-11 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Hozir o'tkazib yuborish
          </Button>
        </div>
      </div>
    </>
  );
}

/* ──────────────── FIELD ──────────────── */
function Field({
  id, label, icon: Icon, type = "text", value, onChange,
  required, placeholder, autoFocus,
}: {
  id: string; label: string; icon?: typeof Phone; type?: string;
  value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <Input
          id={id} type={type} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} required={required}
          autoFocus={autoFocus}
          className={Icon ? "pl-9 h-11" : "h-11"}
        />
      </div>
    </div>
  );
}
