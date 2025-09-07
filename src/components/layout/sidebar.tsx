"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
	CalendarDays,
	ChartColumn,
	CreditCard,
	FileTextIcon,
	Home,
	Library,
	User,
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
import { useAuth } from "@/lib/hooks/useAuth";

// Menu items with role requirements and primary color styling
const getMenuItems = () => {
	const baseItems = [
		{
			title: "Trang chủ",
			url: "/",
			icon: Home,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: undefined,
		},
		{
			title: "Lịch",
			url: "/calendar",
			icon: CalendarDays,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: undefined,
		},
		{
			title: "Báo cáo",
			url: "/reports",
			icon: ChartColumn,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: undefined,
		},
		{
			title: "Quản lý bệnh án",
			url: "/medical-records",
			icon: Library,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
		},
		{
			title: "Quản lý người dùng",
			url: "/users",
			icon: Users,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["ADMIN", "RECEPTIONIST"],
		},
		{
			title: "Thanh toán dịch vụ",
			url: "/invoices",
			icon: CreditCard,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["ADMIN", "RECEPTIONIST", "CASHIER"],
		},
		{
			title: "Xử lý dịch vụ",
			url: "/service-processing",
			icon: FileTextIcon,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["DOCTOR", "TECHNICIAN"],
		}
	];

	return baseItems;
};

export function AppSidebar() {
	const pathname = usePathname();
	const { user, isAuthenticated } = useAuth();
	const currentRole = user?.role;

	const items = getMenuItems().filter((item) => {
		if (!item.roles) return true;
		if (!isAuthenticated) return false;
		return currentRole ? item.roles.includes(currentRole) : false;
	});

	return (
		<Sidebar className="w-52 h-full bg-white border-r">
			{/* <SidebarHeader className="flex flex-row items-center justify-center">
				<Image src="/logos/LogoRevita-v2-noneBG.png" alt="logo" width={65} height={65} />
				
			</SidebarHeader> */}
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu className="w-full">
							{items.map((item) => {
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
