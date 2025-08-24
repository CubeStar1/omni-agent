"use client"

import { ChevronRight, LucideIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface MenuItem {
  title: string
  href: string
  icon: LucideIcon
  description?: string
}

interface NavSectionProps {
  label: string
  items: MenuItem[]
  collapsible?: boolean
  defaultOpen?: boolean
  icon?: LucideIcon
  collapsibleTitle?: string
}

export function NavSection({
  label,
  items,
  collapsible = false,
  defaultOpen = true,
  icon: SectionIcon,
  collapsibleTitle,
}: NavSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const pathname = usePathname()

  // Common button styles
  const baseButtonClass = "group/menu-button font-medium gap-3 h-9 rounded-md text-sm"
  // "Panda" active state: Light background, dark text/icon
  const activeClasses = "bg-muted text-primary shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)]"
  const hoverClasses = "hover:bg-accent"

  const baseIconClass = "h-4 w-4 text-muted-foreground group-hover/menu-button:text-foreground"
  // "Panda" active icon state
  const activeIconClass = "group-data-[active=true]/menu-button:text-primary"

  const MenuItems = () => (
    <>
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild
              className={cn(
                baseButtonClass,
                hoverClasses,
                isActive && activeClasses
              )}
              data-active={isActive}
            >
              <Link href={item.href}>
                <item.icon 
                  className={cn(
                    baseIconClass,
                    isActive && activeIconClass
                  )}
                />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </>
  )

  const CollapsibleItems = () => (
    <SidebarMenuSub>
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <SidebarMenuSubItem key={item.title}>
            <SidebarMenuSubButton 
              asChild
              className={cn(
                baseButtonClass,
                hoverClasses,
                isActive && activeClasses
              )}
              data-active={isActive}
            >
              <Link href={item.href}>
                <item.icon 
                   className={cn(
                    baseIconClass,
                    isActive && activeIconClass
                  )}
                />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        )
      })}
    </SidebarMenuSub>
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {collapsible ? (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              {/* Apply only base styles + standard hover to the trigger */}
              <SidebarMenuButton className={cn(baseButtonClass, hoverClasses)}>
                {SectionIcon && <SectionIcon className={cn(baseIconClass, "mr-2")} />}
                <span>{collapsibleTitle}</span>
                <ChevronRight 
                  className={cn(
                    "ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isOpen ? 'rotate-90' : ''
                  )}
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4">
              <CollapsibleItems />
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <MenuItems />
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
} 