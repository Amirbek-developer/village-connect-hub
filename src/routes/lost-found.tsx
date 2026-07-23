import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { SearchCheck, Phone } from "lucide-react";

export const Route = createFileRoute("/lost-found")({
  head: () => ({
    meta: [
      { title: "Yo'qolgan va topilgan — QishloqNet" },
      { name: "description", content: "Yo'qolgan hujjatlar, buyumlar va uy hayvonlari haqida e'lonlar." },
      { property: "og:title", content: "Yo'qolgan va topilgan — QishloqNet" },
      { property: "og:description", content: "Qishloqda yo'qolgan va topilgan buyumlar." },
    ],
  }),
  component: LostFoundPage,
});

const ITEMS = [
  { status: "Yo'qoldi", title: "Sariq mushuk", desc: "Guzar atrofida. Ismi — Mosh.", phone: "+998 90 123 45 67", color: "bg-destructive/10 text-destructive" },
  { status: "Topildi", title: "Pasport", desc: "Bozor yaqinida topildi.", phone: "+998 91 555 44 33", color: "bg-success/15 text-success" },
  { status: "Yo'qoldi", title: "Velosiped kaliti", desc: "Maktab hovlisida.", phone: "+998 93 222 11 00", color: "bg-destructive/10 text-destructive" },
  { status: "Topildi", title: "Bola qo'lqopi", desc: "Bekat oldida.", phone: "+998 97 888 99 00", color: "bg-success/15 text-success" },
];

function LostFoundPage() {
  return (
    <AppLayout>
      <section className="px-4 lg:px-6 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
            <SearchCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold">Yo'qolgan va topilgan</h1>
            <p className="text-sm text-muted-foreground">Qishloq bo'ylab e'lonlar</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ITEMS.map((i, idx) => (
            <Card key={idx} className="p-4">
              <span className={`inline-block text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${i.color}`}>{i.status}</span>
              <p className="font-display font-bold mt-2">{i.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{i.desc}</p>
              <a href={`tel:${i.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                <Phone className="h-3.5 w-3.5" /> {i.phone}
              </a>
            </Card>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
