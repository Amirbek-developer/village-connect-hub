import { Link } from "@tanstack/react-router";
import { Bell, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LangSwitcher } from "./LangSwitcher";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TopBar() {
  const { user, signOut } = useAuth();
  const { t } = useT();
  const initial = (user?.email ?? "Q").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 backdrop-blur px-4 lg:px-6">
      <Link to="/" className="lg:hidden flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-extrabold text-sm">Q</div>
        <span className="font-display font-extrabold">QishloqNet</span>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <LangSwitcher />
        {user ? (
          <>
            <Button variant="ghost" size="icon" className="relative" aria-label="bildirishnomalar">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 outline-none">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">{initial}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">{t("nav.profile")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> {t("common.signout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/auth">
              <LogIn className="h-4 w-4" /> {t("common.signin")}
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
