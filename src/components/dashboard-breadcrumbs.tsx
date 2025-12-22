"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

// Mapa de tradução de rotas
const routeMap: Record<string, string> = {
  dashboard: "Dashboard",
  agendamentos: "Agendamentos",
  medicos: "Médicos",
  pacientes: "Pacientes",
  config: "Configurações",
  perfil: "Meu Perfil",
  financeiro: "Financeiro",
  create: "Novo",
  edit: "Editar",
};

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter((path) => path);

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          const href = `/${paths.slice(0, index + 1).join("/")}`;
          
          const label = routeMap[path] || (path.length > 20 ? `${path.slice(0, 10)}...` : path);

          return (
            <React.Fragment key={path}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}