import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen bg-white">
      <SidebarProvider>
        <AppSidebar />
        
        <div className="flex flex-col flex-1">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <Toaster />
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
