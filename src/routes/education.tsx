import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, BookOpen, Users, Trophy, PenTool, Library, Baby } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/education")({
  head: () => ({ meta: [{ title: "Ta'lim — QishloqNet" }, { name: "description", content: "Maktab xabarlari, repetitorlar, kutubxona va bolalar to'garaklari." }] }),
  component: EduPage,
});

const SECTIONS = [
  { icon: GraduationCap, title: "Maktab xabarlari", desc: "Darslar jadvali, imtihon sanalari, ta'tillar", color: "text-primary bg-primary/10" },
  { icon: PenTool, title: "Repetitor topish", desc: "Matematika, ingliz, fizika va boshqalar", color: "text-info bg-info/15" },
  { icon: Users, title: "Uy vazifalari yordami", desc: "Savol-javob guruhlari va yordam", color: "text-secondary-foreground bg-secondary/20" },
  { icon: Library, title: "Kutubxona", desc: "Raqamli kitoblar va o'quv materiallari", color: "text-accent bg-accent/15" },
  { icon: Trophy, title: "Grant va kurslar", desc: "Stipendiya va bepul ta'lim imkoniyatlari", color: "text-success bg-success/15" },
  { icon: Baby, title: "Bolalar to'garaklari", desc: "Sport, san'at va ijodiy mashg'ulotlar", color: "text-warning bg-warning/15" },
];

function EduPage() {
  return (
    <AppLayout>
      <PageHeader title="Ta'lim va bolalar" subtitle="Mahalliy ta'lim muassasalari va o'quv resurslari" />

      <div className="px-4 lg:px-6 pb-6">
        <Card className="p-6 mb-5 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/5 border-primary/20">
          <BookOpen className="h-8 w-8 text-primary mb-2" />
          <h2 className="font-display text-xl font-extrabold">Ta'lim — eng yaxshi sarmoya</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Qishlog'imiz farzandlari uchun sifatli ta'limga to'siqsiz kirish. Maktab, repetitor va o'quv resurslari bir joyda.
          </p>
        </Card>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="p-5 card-hover">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${s.color} mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-display font-bold">{s.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                <Badge variant="outline" className="mt-3 text-[10px]">Tez orada</Badge>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
