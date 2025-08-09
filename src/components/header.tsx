"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

const navigationItems = [
  { title: "Consultas", href: "/consultas" },
  { title: "Recursos", href: "/recursos" },
  { title: "Serviços", href: "/servicos" },
  { title: "Sobre nós", href: "/sobre" },
  { title: "Contato", href: "/contato" },
]

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/home/logo-principal.svg" 
              alt="HealthFirst Logo"
              width={100}  
              height={100} 
              className="h-50 w-50"
            />
          </Link>
          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink
                    href={item.href}
                    className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                    )}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost">
              Entrar
            </Button>
            <Button>
              Inscreva-se
            </Button>
          </div>

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 pt-8">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="block px-2 py-1 text-lg hover:text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.title}
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Button variant="ghost" className="w-full justify-start">
                    Entrar
                  </Button>
                  <Button className="w-full justify-start">
                    Inscreva-se
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}