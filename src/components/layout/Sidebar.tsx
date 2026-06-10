import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Megaphone, ShoppingBasket, Wrench, Landmark,
  HeartPulse, GraduationCap, MessagesSquare, User as UserIcon
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/announcements", icon: Megaphone, key: "nav.announcements" },
  { to: "/marketplace", icon: ShoppingBasket, key: "nav.marketplace" },
  { to: "/services", icon: Wrench, key: "nav.services" },
  { to: "/gov", icon: Landmark, key: "nav.gov" },
  { to: "/health", icon: HeartPulse, key: "nav.health" },
  { to: "/education", icon: GraduationCap, key: "nav.education" },
  { to: "/forum", icon: MessagesSquare, key: "nav.forum" },
  { to: "/profile", icon: UserIcon, key: "nav.profile" },
] as const;

export function Sidebar() {
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5">
      <Link to="/" className="flex items-center gap-2 px-3 pb-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-extrabold">
          Q
        </div>
        <div className="flex flex-col">
          <span className="font-display text-lg font-extrabold tracking-tight">QishloqNet</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Jamoa platformasi</span>
        </div>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl bg-gradient-to-br from-primary/10 to-secondary/15 p-4">
        <p className="font-display text-sm font-bold leading-snug">Qishlog'ingni raqamlashtir</p>
        <p className="mt-1 text-xs text-muted-foreground">Hokimlik bilan bevosita aloqa.</p>
      </div>
    </aside>
  );
}
