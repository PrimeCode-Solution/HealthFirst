"use client";

import * as React from "react";
import {
  BookOpen,
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  CreditCard,
  ShieldCheck,
  LogOut,
  Stethoscope,
  AlertCircle,
  History
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useSession, signOut } from "next-auth/react";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;
  const userName = session?.user?.name || "Usuário";

  const { hasAccess } = usePremiumAccess(userId);

  const navigationData = React.useMemo(() => {
    const menuItems = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ];

    if (userRole === "ADMIN" || userRole === "DOCTOR") {
      menuItems.push({
        title: "Agendamentos",
        url: "/dashboard/agendamentos",
        icon: Calendar,
      });
    }

    if (userRole === "ADMIN") {
      menuItems.push(
        {
          title: "Conteúdo",
          url: "/dashboard/conteudo",
          icon: BookOpen,
        },
        {
          title: "Médicos",
          url: "/dashboard/medicos",
          icon: ShieldCheck,
        },
        {
          title: "Consultas",
          url: "/dashboard/admin/consultas", 
          icon: Stethoscope, 
        },
        {
          title: "Cancelamentos",
          url: "/dashboard/admin/cancelamentos",
          icon: AlertCircle, 
        },
        {
          title: "Histórico",
          url: "/dashboard/admin/historico",
          icon: History, 
        },
        {
          title: "Clientes",
          url: "/dashboard/clientes",
          icon: Users,
        },
        {
          title: "Assinantes",
          url: "/dashboard/admin/assinaturas",
          icon: CreditCard,
        }
      );
    }

    if (userRole === "USER") {
      if (hasAccess) {
        menuItems.push({
          title: "Minha Assinatura",
          url: "/dashboard/minha-assinatura",
          icon: CreditCard,
        });
      }
      
      menuItems.push({
        title: "Conteúdo Premium",
        url: "/dashboard/conteudo",
        icon: BookOpen,
      });
    }

    menuItems.push({
      title: "Configurações",
      url: "/dashboard/config",
      icon: Settings,
    });

    return menuItems;
  }, [userRole, hasAccess]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">HealthFirst</span>
            <span className="text-xs text-muted-foreground">Painel {userRole}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData} />
      </SidebarContent>
      
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-5 w-5 text-destructive" />
              <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                <span className="font-semibold truncate">{userName}</span>
                <span className="text-xs text-muted-foreground">Sair da conta</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}