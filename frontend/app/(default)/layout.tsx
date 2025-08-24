import { Metadata } from "next"
import { AppSidebar } from "@/components/global/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"

export const metadata: Metadata = {
  title: "Response Dashboard",
  description: "A dashboard for monitoring responses",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
    <AppSidebar/>
    <SidebarInset>
        <Breadcrumbs />
        <main className="flex-1  py-6 px-4">
        {children}
      </main>
    </SidebarInset>
  </SidebarProvider>
  )
} 