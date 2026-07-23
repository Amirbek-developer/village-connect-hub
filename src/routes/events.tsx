import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Tadbirlar — QishloqNet" },
      { name: "description", content: "Qishloqdagi yaqinlashayotgan to'ylar, bayramlar, mahalla uchrashuvlari va boshqa tadbirlar." },
      { property: "og:title", content: "Tadbirlar — QishloqNet" },
      { property: "og:description", content: "Qishloqdagi tadbirlar takvimi." },
    ],
  }),
  component: EventsPage,
});

const SAMPLE = [
  { title: "Mahalla yig'ilishi", date: "27-noyabr, 18:00", place: "Guzar chorrahasi", type: "Uchrashuv", color: "bg-primary/10 text-primary" },
  { title: "Hosil bayrami", date: "5-dekabr, 10:00", place: "Markaziy maydon", type: "Bayram", color: "bg-secondary/20 text-secondary-foreground" },
  { title: "Yoshlar sporti", date: "12-dekabr, 15:00", place: "Maktab stadioni", type: "Sport", color: "bg-info/15 text-info" },
  { title: "Xayriya bozorchasi", date: "20-dekabr, 09:00", place: "Madaniyat uyi", type: "Xayriya", color: "bg-accent/15 text-accent" },
];

function EventsPage() {
  return (
    <AppLayout>
      <section className="px-4 lg:px-6 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold">Tadbirlar</h1>
            <p className="text-sm text-muted-foreground">Yaqin kunlardagi jamoat tadbirlari</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SAMPLE.map((e) => (
            <Card key={e.title} className="p-4">
              <span className={`inline-block text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${e.color}`}>{e.type}</span>
              <p className="font-display font-bold mt-2">{e.title}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Clock className="h-3.5 w-3.5" /> {e.date}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5" /> {e.place}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
