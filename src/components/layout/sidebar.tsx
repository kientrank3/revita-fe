"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChartColumn,
  Home,
  Library,
  Users,
} from "lucide-react";


import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Menu items with color settings
const getMenuItems = () => {
  const baseItems = [
    {
      title: "Trang chủ",
      url: "/",
      icon: Home,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Lịch",
      url: "/calendar",
      icon: CalendarDays,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Báo cáo",
      url: "/reports",
      icon: ChartColumn,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      title: "Quản lý bệnh án",
      url: "/medical-records",
      icon: Library,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    {   
    title: "Quản lý người dùng",
      url: "/users",
      icon: Users,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
    },
  ];

  return baseItems;
};

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="w-52 h-full bg-white border-r">
        {/* <SidebarHeader className="flex flex-row items-center justify-center">
            <Image src="/logos/LogoRevita-v2-noneBG.png" alt="logo" width={65} height={65} />
            
        </SidebarHeader> */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="w-full">
              {getMenuItems().map((item) => {
                const isActive =
                  item.url === "/"
                    ? pathname === "/"
                    : item.url.startsWith("/admin")
                      ? pathname.startsWith(item.url)
                      : pathname === item.url;

                return (
                  <SidebarMenuItem key={`${item.title}-${item.url}`}>
                    <SidebarMenuButton
                      asChild
                      className={cn("h-16", isActive && item.bgColor)}
                      isActive={isActive}
                    >
                      <Link
                        href={item.url}
                        className="flex flex-row items-center w-full px-2.5"
                      >
                        <p className={cn(item.color)}>
                          <item.icon />
                        </p>
                        <p
                          className={cn(
                            "text-center text-[12px] font-semibold",
                            isActive ? "text-gray-900" : "text-gray-600",
                          )}
                        >
                          {item.title}
                        </p>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarFooter>
        <SidebarMenuButton asChild className="mb-10 rounded-full">
          <Link
            href={"/"}
            className="flex flex-col items-center justify-center w-full h-20"
          >
            <p className="text-orange-500">
              <Bell />
            </p>
          </Link>
        </SidebarMenuButton>
      </SidebarFooter> */}
    </Sidebar>
  );
}
