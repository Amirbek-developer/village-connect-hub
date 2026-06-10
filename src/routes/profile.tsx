import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { AuthRequired } from "@/components/shared/AuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profil — QishloqNet" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <AppLayout>
      <PageHeader title="Profilim" subtitle="Shaxsiy ma'lumotlar va sozlamalar" />
      <div className="px-4 lg:px-6 pb-6">
        <AuthRequired><ProfileBody /></AuthRequired>
      </div>
    </AppLayout>
  );
}

function ProfileBody() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: villages = [] } = useQuery({
    queryKey: ["villages"],
    queryFn: async () => (await supabase.from("villages").select("*").order("name")).data ?? [],
  });

  const { data: counts } = useQuery({
    queryKey: ["profile-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [a, p, s] = await Promise.all([
        supabase.from("announcements").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("seller_id", user!.id),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("provider_id", user!.id),
      ]);
      return { ann: a.count ?? 0, prod: p.count ?? 0, srv: s.count ?? 0 };
    },
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [villageId, setVillageId] = useState<string>("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setBio(profile.bio ?? "");
      setVillageId(profile.village_id ?? "");
    }
  }, [profile]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        name, phone: phone || null, bio: bio || null, village_id: villageId || null,
      }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil saqlandi");
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Card className="h-64 animate-pulse bg-muted/40" />;

  const initial = (name || user?.email || "Q").charAt(0).toUpperCase();
  const village = villages.find((v) => v.id === villageId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
      {/* Summary */}
      <Card className="p-6 h-fit">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 ring-4 ring-primary/15">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-2xl font-display font-extrabold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-3 font-display font-extrabold text-lg">{name || "Foydalanuvchi"}</h2>
          <p className="text-xs text-muted-foreground truncate max-w-full">{user?.email}</p>
          {profile?.verified ? (
            <Badge className="mt-2 gap-1 bg-success text-success-foreground"><ShieldCheck className="h-3 w-3" /> Tasdiqlangan</Badge>
          ) : (
            <Badge variant="outline" className="mt-2 text-[10px]">Tasdiqlanmagan</Badge>
          )}
          {village && (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {village.name}, {village.region}
            </p>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat n={counts?.ann ?? 0} label="E'lon" />
          <Stat n={counts?.prod ?? 0} label="Mahsulot" />
          <Stat n={counts?.srv ?? 0} label="Xizmat" />
        </div>

        <Button variant="outline" className="w-full mt-5 gap-2" onClick={async () => {
          await signOut(); navigate({ to: "/" }); toast.success("Chiqildi");
        }}>
          <LogOut className="h-4 w-4" /> Chiqish
        </Button>
      </Card>

      {/* Edit form */}
      <Card className="p-6">
        <h3 className="font-display font-bold mb-4">Profilni tahrirlash</h3>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); update.mutate(); }}>
          <div><Label className="text-xs">To'liq ism</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
          <div><Label className="text-xs">Telefon</Label>
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
          </div>
          <div><Label className="text-xs">O'zi haqida</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} placeholder="Bir necha so'z..." />
          </div>
          <Button type="submit" disabled={update.isPending} className="gap-2">
            <Save className="h-4 w-4" /> {update.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-border">
          <p className="text-xs text-muted-foreground">
            QishloqNet jamoasiga qo'shilganingizdan minnatdormiz. Qishlog'ingiz uchun hissa qo'shing —{" "}
            <Link to="/announcements" className="text-primary font-medium hover:underline">e'lon qo'shing</Link>{" "}
            yoki{" "}
            <Link to="/gov" className="text-primary font-medium hover:underline">muammo bildiring</Link>.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="font-display font-extrabold text-lg">{n}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}
