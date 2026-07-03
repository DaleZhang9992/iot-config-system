"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import LanguageSwitcher from "./language-switcher";
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Microscope,
  Settings,
  Users,
  Mail,
  History,
  LogOut,
  FileText,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations("nav");
  const role = session?.user?.role;

  const allNavItems: NavItem[] = [
    { href: "/sales/orders", label: t("myOrders"), icon: <ShoppingCart className="h-4 w-4" /> },
    { href: "/fae/orders", label: t("faeWorkspace"), icon: <Wrench className="h-4 w-4" /> },
    { href: "/rd/orders", label: t("rdWorkspace"), icon: <Microscope className="h-4 w-4" /> },
  ];

  const adminNavItems: NavItem[] = [
    { href: "/admin", label: t("dashboard"), icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/admin/users", label: t("userManagement"), icon: <Users className="h-4 w-4" /> },
    { href: "/admin/email-config", label: t("emailConfig"), icon: <Mail className="h-4 w-4" /> },
    { href: "/admin/history", label: t("auditLog"), icon: <History className="h-4 w-4" /> },
    { href: "/admin/settings", label: t("systemSettings"), icon: <Settings className="h-4 w-4" /> },
  ];

  function getNavItems(): NavItem[] {
    if (role === "ADMIN") return [...allNavItems, ...adminNavItems];
    switch (role) {
      case "SALES": return allNavItems.filter(n => n.href.startsWith("/sales"));
      case "FAE": return allNavItems.filter(n => n.href.startsWith("/fae"));
      case "RD": return allNavItems.filter(n => n.href.startsWith("/rd"));
      default: return [];
    }
  }

  const navItems = getNavItems();

  return (
    <div className="flex h-screen flex-col border-r bg-background w-64">
      {/* Logo */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">IoT Config</span>
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted"
              )}
            >
              {item.icon}
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {session?.user?.name}
          </span>
          <LanguageSwitcher />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {session ? "退出登录" : "Logout"}
        </Button>
      </div>
    </div>
  );
}
