"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Shield,
  HelpCircle,
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/useAuth";

export function AppHeader() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [notifications] = useState(3);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  useEffect(() => {
    console.log("isAuthenticated",isAuthenticated);
    console.log("isLoading",isLoading);
    console.log("user",user);
  }, [user, isAuthenticated, isLoading]);

  const handleLogout = async () => {
    await logout();
    // Redirect to homepage after logout
    window.location.href = '/';
  };

  const handleProfile = () => {
    // For sidebar-layout users (admin, doctor, receptionist, cashier), 
    // redirect to sidebar-layout profile page
    window.location.href = '/staff-profile';
  };

  const handleSettings = () => {
    // Implement settings navigation
    console.log("Settings clicked");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - Logo and App Name */}
      <div className="flex items-center gap-3">
        <Image 
          src="/logos/LogoRevita-v1-noneBG.png" 
          alt="Revita Logo" 
          width={40} 
          height={40}
          className="rounded-lg"
        />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-gray-900">Revita</h1>
          <p className="text-xs text-gray-500">Hệ thống quản lý y tế</p>
        </div>
      </div>

      {/* Right side - Notifications and User Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications - Only show if authenticated */}
        {isAuthenticated && !isLoading && (
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notifications}
              </Badge>
            )}
          </Button>
        )}

        {/* User Profile Dropdown or Login Button */}
        {isAuthenticated && user && !isLoading ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild >
              <Button variant="ghost" className="flex items-center gap-2 p-2 hover:bg-gray-100 ">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-500 text-sm font-medium">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'DOCTOR' ? 'Bác sĩ' : user.role === 'RECEPTIONIST' ? 'Lễ tân' : user.role === 'PATIENT' ? 'Bệnh nhân' : user.role === 'CASHIER' ? 'Thu ngân' : 'Kỹ thuật'}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'DOCTOR' ? 'Bác sĩ' : user.role === 'RECEPTIONIST' ? 'Lễ tân' : user.role === 'PATIENT' ? 'Bệnh nhân' : user.role === 'CASHIER' ? 'Thu ngân' : 'Kỹ thuật'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Hồ sơ cá nhân</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Cài đặt</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                <span>Bảo mật</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Trợ giúp</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : !isLoading ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/register">
                <span>Đăng ký</span>
              </Link>
            </Button>
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                <span>Đăng nhập</span>
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
