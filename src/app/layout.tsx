import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { LayoutRedirect } from "@/components/auth/LayoutRedirect";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Revita - Hệ thống quản lý y tế",
  description: "Hệ thống quản lý y tế toàn diện cho bệnh viện và phòng khám",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          <LayoutRedirect />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
