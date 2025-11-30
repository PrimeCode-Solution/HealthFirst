"use client";

import * as React from "react";
import {
  IconCalendarUser,
  IconLogout,
  IconNotebook,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { signOut } from "next-auth/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import Image from "next/image";
import { Button } from "./ui/button";

const data = {
  navMain: [
    {
      title: "Consultas",
      url: "/dashboard",
      icon: IconCalendarUser,
    },
    {
      title: "Clientes",
      url: "/dashboard/clientes",
      icon: IconUsers,
    },
    {
      title: "Configurações",
      url: "/dashboard/config",
      icon: IconSettings,
    },
    {
      title: "Conteúdo",
      url: "/dashboard/conteudo",
      icon: IconNotebook,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // 2. Função para realizar o logout e redirecionar
  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: "/", 
      redirect: true 
    });
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex justify-center py-2">
              <Image
                width={140}
                height={70}
                src="/images/home/logo-principal.svg" 
                alt="HealthFirst Logo"
                className="object-contain"
                priority
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {/* 3. Botão com ação de logout */}
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="w-full flex items-center justify-start gap-2"
        >
          <IconLogout className="size-4" /> 
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}