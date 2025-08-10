"use client";

import * as React from "react";
import {
  IconCalendarUser,
  IconLogout,
  IconNotebook,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

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
      url: "/dashboard/configuracoes",
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
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Image
              width={200}
              height={100}
              src="./images/home/logo-principal.svg"
              alt="User Avatar"
              className="rounded-full"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <Button variant="outline">
          <IconLogout /> Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
