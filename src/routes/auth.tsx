import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Kirish — QishloqNet" }, { name: "description", content: "QishloqNet platformasiga kirish yoki ro'yxatdan o'tish." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && user && pathname === "/auth") navigate({ to: "/" });
  }, [user, loading, navigate, pathname]);

  return (
    <div className="min-h-screen flex">
      {/* Left hero (desktop) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground items-center justify-center p-12">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="relative max-w-md">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-background/15 backdrop-blur font-display font-extrabold text-2xl">Q</div>
          <h1 className="mt-6 font-display text-4xl font-extrabold text-balance leading-tight">Qishlog'ingiz bir bosishda</h1>
          <p className="mt-4 text-primary-foreground/90 text-balance">
            QishloqNet — sizning mahallangiz, qishlog'ingiz uchun yaratilgan platforma.
            E'lonlar, bozor, ustalar, davlat xizmatlari va jamoa muhokamasi bir joyda.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-primary-foreground/80">
            <li>✓ Mahalliy bozor va to'g'ridan-to'g'ri fermer mahsulotlari</li>
            <li>✓ Yo'l, suv, gaz muammolarini hokimlikka yetkazish</li>
            <li>✓ Tasdiqlangan usta va xizmat ko'rsatuvchilarni topish</li>
          </ul>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md p-6 sm:p-8 shadow-warm border-border/60">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-extrabold">Q</div>
            <div>
              <p className="font-display text-lg font-extrabold leading-none">QishloqNet</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Jamoa platformasi</p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-extrabold">Xush kelibsiz</h2>
          <p className="mt-1 text-sm text-muted-foreground">Davom etish uchun tizimga kiring</p>

          <Button
            type="button"
            variant="outline"
            className="mt-5 w-full justify-center gap-2 h-11"
            onClick={async () => {
              const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
              if (res.error) toast.error("Google bilan kirishda xatolik");
            }}
          >
            <GoogleIcon /> Google bilan davom etish
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">yoki email orqali</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Kirish</TabsTrigger>
              <TabsTrigger value="signup">Ro'yxatdan o'tish</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignUpForm />
            </TabsContent>
          </Tabs>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            Davom etish orqali siz foydalanish shartlariga rozilik bildirasiz.
          </p>
        </Card>
      </div>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) toast.error(error.message);
        else {
          toast.success("Xush kelibsiz!");
          navigate({ to: "/" });
        }
      }}
    >
      <Field id="si-email" label="Email" icon={Mail} type="email" value={email} onChange={setEmail} required />
      <Field id="si-pw" label="Parol" icon={Lock} type="password" value={password} onChange={setPassword} required />
      <Button type="submit" disabled={loading} className="w-full h-11 gap-2">
        {loading ? "Tekshirilmoqda..." : <>Kirish <ArrowRight className="h-4 w-4" /></>}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 8) { toast.error("Parol kamida 8 belgi"); return; }
        setLoading(true);
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name, phone },
          },
        });
        setLoading(false);
        if (error) toast.error(error.message);
        else {
          toast.success("Hisob yaratildi!");
          navigate({ to: "/" });
        }
      }}
    >
      <Field id="su-name" label="To'liq ism" value={name} onChange={setName} required />
      <Field id="su-phone" label="Telefon" icon={Phone} value={phone} onChange={setPhone} placeholder="+998 90 123 45 67" />
      <Field id="su-email" label="Email" icon={Mail} type="email" value={email} onChange={setEmail} required />
      <Field id="su-pw" label="Parol (kamida 8 belgi)" icon={Lock} type="password" value={password} onChange={setPassword} required />
      <Button type="submit" disabled={loading} className="w-full h-11 gap-2 bg-accent hover:bg-accent/90">
        {loading ? "Yaratilmoqda..." : <>Hisob yaratish <ArrowRight className="h-4 w-4" /></>}
      </Button>
    </form>
  );
}

function Field({ id, label, icon: Icon, type = "text", value, onChange, required, placeholder }: {
  id: string; label: string; icon?: typeof Mail; type?: string; value: string;
  onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <Input
          id={id} type={type} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} required={required}
          className={Icon ? "pl-9 h-11" : "h-11"}
        />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
