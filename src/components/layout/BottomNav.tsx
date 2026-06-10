import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Megaphone, Plus, ShoppingBasket, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const ITEMS = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/announcements", icon: Megaphone, key: "nav.announcements" },
  { to: "/marketplace", icon: ShoppingBasket, key: "nav.marketplace" },
  { to: "/profile", icon: UserIcon, key: "nav.profile" },
] as const;

export function BottomNav() {
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-end">
        {ITEMS.slice(0, 2).map((it) => (
          <NavItem key={it.to} to={it.to} icon={it.icon} labelKey={it.key} active={pathname === it.to} t={t} />
        ))}
        <div className="flex items-start justify-center -mt-5">
          <Link
            to="/announcements"
            className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-pop transition-transform active:scale-95"
            aria-label={t("nav.add")}
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </Link>
        </div>
        {ITEMS.slice(2).map((it) => (
          <NavItem key={it.to} to={it.to} icon={it.icon} labelKey={it.key} active={pathname === it.to} t={t} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({ to, icon: Icon, labelKey, active, t }: { to: string; icon: typeof Home; labelKey: string; active: boolean; t: (k: string) => string }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium min-h-[44px]",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="truncate max-w-full px-1">{t(labelKey)}</span>
    </Link>
  );
}
