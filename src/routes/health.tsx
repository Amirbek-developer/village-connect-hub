import { createFileRoute } from "@tanstack/react-router";
import { Phone, Stethoscope, Pill, Droplet, Brain, Siren, HeartPulse, Flame, ShieldAlert } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/health")({
  head: () => ({ meta: [{ title: "Sog'liq va favqulodda yordam — QishloqNet" }, { name: "description", content: "Tibbiy yordam, dorixonalar va favqulodda aloqa raqamlari." }] }),
  component: HealthPage,
});

const EMERGENCY = [
  { num: "103", label: "Tez yordam", icon: HeartPulse, color: "bg-destructive text-destructive-foreground" },
  { num: "101", label: "O't o'chirish", icon: Flame, color: "bg-accent text-accent-foreground" },
  { num: "102", label: "Politsiya", icon: ShieldAlert, color: "bg-info text-info-foreground" },
  { num: "104", label: "Gaz", icon: Flame, color: "bg-secondary text-secondary-foreground" },
];

const SERVICES = [
  { icon: Stethoscope, title: "Poliklinika grafigi", desc: "Vrachlar navbati va qabul vaqtlari", color: "text-primary bg-primary/10" },
  { icon: Pill, title: "Dorixona qidiruv", desc: "Qaysi dorixonada qaysi dori bor", color: "text-info bg-info/15" },
  { icon: Droplet, title: "Qon donorlik", desc: "Qon guruhi bo'yicha donorlar ro'yxati", color: "text-destructive bg-destructive/10" },
  { icon: Brain, title: "Psixologik yordam", desc: "Onlayn maslahat va qo'llab-quvvatlash", color: "text-accent bg-accent/15" },
];

function HealthPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Sog'liq va favqulodda yordam"
        subtitle="Tibbiy xizmatlar va shoshilinch aloqa"
      />

      <div className="px-4 lg:px-6 space-y-6 pb-6">
        {/* Emergency */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Siren className="h-5 w-5 text-destructive" />
            <h2 className="font-display text-lg font-bold">Favqulodda aloqa</h2>
            <Badge variant="destructive" className="text-[10px]">24/7</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EMERGENCY.map((e) => {
              const Icon = e.icon;
              return (
                <a key={e.num} href={`tel:${e.num}`} className={`rounded-2xl p-4 ${e.color} flex flex-col items-center gap-2 shadow-warm hover:scale-[1.02] transition-transform`}>
                  <Icon className="h-7 w-7" />
                  <p className="font-display font-extrabold text-3xl">{e.num}</p>
                  <p className="text-xs font-medium opacity-95">{e.label}</p>
                </a>
              );
            })}
          </div>
        </section>

        {/* Services */}
        <section>
          <h2 className="font-display text-lg font-bold mb-3">Tibbiy xizmatlar</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.title} className="p-5 card-hover">
                  <div className="flex items-start gap-3">
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${s.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-display font-bold">{s.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
                      <Badge variant="outline" className="mt-2 text-[10px]">Tez orada</Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Pharmacy banner */}
        <Card className="p-5 bg-gradient-to-r from-primary/5 via-success/5 to-secondary/10 border-primary/20">
          <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display font-bold">Qo'shimcha yordamga muhtojmisiz?</p>
              <p className="text-sm text-muted-foreground mt-0.5">Mahalla doktoringizga to'g'ridan-to'g'ri murojaat qiling.</p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
