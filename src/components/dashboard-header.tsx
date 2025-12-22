import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs";

export function DashboardHeader() {
  return (
    <header className="flex sticky top-0 bg-white h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger size="lg" className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <DashboardBreadcrumbs />
        <div className="ml-auto flex items-center gap-2">
          <Link href="/">
            <Image
              width={100}
              height={100}
              src="/images/home/logo-principal.svg" 
              alt="User Avatar"
              className="flex rounded-full sm:hidden"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}