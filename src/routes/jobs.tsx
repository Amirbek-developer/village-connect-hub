import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Briefcase, MapPin, Coins } from "lucide-react";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Ish o'rinlari — QishloqNet" },
      { name: "description", content: "Qishloqdagi mavjud ish o'rinlari, mavsumiy ishlar va vakansiyalar." },
      { property: "og:title", content: "Ish o'rinlari — QishloqNet" },
      { property: "og:description", content: "Mahalliy vakansiyalar va mavsumiy ishlar." },
    ],
  }),
  component: JobsPage,
});

const JOBS = [
  { title: "Traktorchi", salary: "5 000 000 so'm/oy", place: "Shamsiko'l fermer xo'jaligi", type: "To'liq stavka" },
  { title: "Bog'bon yordamchisi", salary: "150 000 so'm/kun", place: "Elatan bog'i", type: "Mavsumiy" },
  { title: "Sotuvchi (do'kon)", salary: "3 500 000 so'm/oy", place: "Sho'rqo'rg'on markazi", type: "To'liq stavka" },
  { title: "Uy hayvonlari parvarishi", salary: "Kelishiladi", place: "Xususiy xo'jalik", type: "Yarim stavka" },
];

function JobsPage() {
  return (
    <AppLayout>
      <section className="px-4 lg:px-6 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-info/15 text-info">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold">Ish o'rinlari</h1>
            <p className="text-sm text-muted-foreground">Qishloqdagi vakansiyalar</p>
          </div>
        </div>
        <div className="grid gap-3">
          {JOBS.map((j) => (
            <Card key={j.title} className="p-4 card-hover">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-bold">{j.title}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5" />{j.salary}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.place}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold rounded-full bg-primary/10 text-primary px-2 py-0.5 shrink-0">{j.type}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
