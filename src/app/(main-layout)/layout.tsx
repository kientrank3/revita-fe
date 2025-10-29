
import { MainFooter } from "@/components/layout/main-footer";
import { MainHeader } from "@/components/layout/main-header";
import { Toaster } from "@/components/ui/sonner";
import { ChatbotFAB } from "@/components/chatbot/ChatbotFAB";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      <MainHeader />
      <main className="flex-1">
        <Toaster />
        {children}
      </main>
      <MainFooter />
      <ChatbotFAB />
    </div>
  );
}
