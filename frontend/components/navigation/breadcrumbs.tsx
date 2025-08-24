"use client"

import { ModeToggle } from "@/components/global/theme-switcher"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"

type RouteConfig = {
  name: string
  path: string
  description?: string
  subRoutes?: Record<string, RouteConfig>
}

type Routes = Record<string, RouteConfig>

export function Breadcrumbs({ 
  action,
  routes,
}: { 
  action?: React.ReactNode
  routes?: Routes
}) {
  const pathname = usePathname()
  
  const formatPathSegment = (segment: string) => {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const findRouteConfig = (path: string): RouteConfig | undefined => {
    if (!routes) return undefined

    // Direct match
    if (routes[path]) return routes[path]

    // Check in subRoutes
    for (const route of Object.values(routes)) {
      if (route.subRoutes && route.subRoutes[path]) {
        return route.subRoutes[path]
      }
    }

    return undefined
  }
  
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const items = []
    let currentPath = ""
    
    // Always add home
    const homeConfig = routes?.["/"]
    items.push(
      <BreadcrumbItem key="home">
        <BreadcrumbLink href="/">
          {homeConfig?.name || "Home"}
        </BreadcrumbLink>
      </BreadcrumbItem>
    )

    // Add intermediate segments
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const routeConfig = findRouteConfig(currentPath)
      
      // Get the display name - either from config or format the path segment
      const name = routeConfig?.name || formatPathSegment(segment)
      
      items.push(<BreadcrumbSeparator key={`separator-${index}`} />)
      
      if (index === segments.length - 1) {
        // Last segment - show as current page
        items.push(
          <BreadcrumbItem key={currentPath}>
            <BreadcrumbPage>{name}</BreadcrumbPage>
          </BreadcrumbItem>
        )
      } else {
        // Intermediate segment - show as link
        items.push(
          <BreadcrumbItem key={currentPath}>
            <BreadcrumbLink href={routeConfig?.path || currentPath}>
              {name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        )
      }
    })

    return items
  }

  return (
    <header className="flex h-20 z-50 shrink-0 sticky top-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {getBreadcrumbs()}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-4">
          {action}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
} 