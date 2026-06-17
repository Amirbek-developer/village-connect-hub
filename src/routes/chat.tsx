import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Search } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — QishloqNet" }] }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <AppLayout>
      <PageHeader title="Chat" subtitle="Qishloqdoshlar bilan bevosita yozishma" />
      <div className="px-4 lg:px-6 pb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Suhbat yoki foydalanuvchi qidirish..." className="pl-9" />
        </div>

        <Card className="p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h3 className="mt-4 font-display font-extrabold text-lg">Hali suhbatlar yo'q</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            E'lon yoki mahsulot egasi bilan bog'lanish uchun uning sahifasidagi
            "Yozish" tugmasini bosing. Tez orada to'liq real-time chat ishga tushadi.
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
