import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";
import type { ReactNode } from "react";

export function AuthRequired({ children, message }: { children: ReactNode; message?: string }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-center text-muted-foreground text-sm">Yuklanmoqda...</div>;
  if (!user) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          icon={Lock}
          title="Tizimga kirish kerak"
          description={message ?? "Bu sahifani ko'rish va amallarni bajarish uchun ro'yxatdan o'ting."}
          action={<Button asChild><Link to="/auth">Kirish / Ro'yxatdan o'tish</Link></Button>}
        />
      </div>
    );
  }
  return <>{children}</>;
}
