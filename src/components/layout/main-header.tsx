'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings,
  Calendar,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

export function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'DOCTOR': return 'Bác sĩ';
      case 'RECEPTIONIST': return 'Lễ tân';
      case 'CASHIER': return 'Thu ngân';
      case 'PATIENT': return 'Bệnh nhân';
      default: return 'Người dùng';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'DOCTOR': return 'default';
      case 'RECEPTIONIST': return 'secondary';
      case 'CASHIER': return 'secondary';
      case 'PATIENT': return 'outline';
      default: return 'outline';
    }
  };

  const handleLogout = () => {
    logout();
    // Redirect to homepage after logout
    window.location.href = '/';
  };

  const handleProfile = () => {
    // For main-layout users (mainly patients), they should stay in main-layout
    window.location.href = '/profile';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
               <Image src="/logos/LogoRevita-v1-noneBG.png" alt="Revita Logo" width={32} height={32} className='rounded-lg'/>
              </div>
              <span className="text-xl font-bold text-gray-900">Revita</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-primary transition-colors duration-200"
            >
              Trang chủ
            </Link>
            <Link 
              href="/services" 
              className="text-gray-600 hover:text-primary transition-colors duration-200"
            >
              Dịch vụ
            </Link>
            <Link 
              href="/doctors" 
              className="text-gray-600 hover:text-primary transition-colors duration-200"
            >
              Bác sĩ
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-600 hover:text-primary transition-colors duration-200"
            >
              Liên hệ
            </Link>
            <Link href="/drug-search" className="text-gray-600 hover:text-primary transition-colors duration-200">
              Tra cứu thuốc
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Patient specific actions */}
                {user.role === 'PATIENT' && (
                  <div className="hidden sm:flex items-center space-x-2">
                    <Button asChild size="sm">
                      <Link href="/booking">
                        <Calendar className="h-4 w-4 mr-2" />
                        Đặt lịch
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/my-appointments">
                        <Calendar className="h-4 w-4 mr-2" />
                        Lịch hẹn
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/my-patient-profiles">
                        <FileText className="h-4 w-4 mr-2" />
                        Hồ sơ bệnh nhân
                      </Link>
                    </Button>
                    
                  </div>
                )}

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || ''} alt={user.name} />
                        <AvatarFallback className="bg-primary text-white text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <Badge 
                          variant={getRoleBadgeVariant(user.role)} 
                          className="w-fit text-xs"
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfile}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ cá nhân</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Cài đặt</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <Link
                href="/"
                className="block px-3 py-2 text-gray-600 hover:text-primary transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                href="/services"
                className="block px-3 py-2 text-gray-600 hover:text-primary transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Dịch vụ
              </Link>
              <Link
                href="/doctors"
                className="block px-3 py-2 text-gray-600 hover:text-primary transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Bác sĩ
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-gray-600 hover:text-primary transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Liên hệ
              </Link>
              
              {/* Patient specific mobile actions */}
              {user?.role === 'PATIENT' && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/booking"
                    className="block px-3 py-2 text-gray-600 hover:text-primary transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Đặt lịch
                  </Link>
                  <Link
                    href="/my-appointments"
                    className="block px-3 py-2 text-gray-600 hover:text-primary transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Lịch hẹn
                  </Link>
                  <Link
                    href="/my-patient-profiles"
                    className="block px-3 py-2 text-gray-600 hover:text-primary transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    Hồ sơ bệnh nhân
                  </Link>
                  <Link
                    href="/drug-search"
                    className="block px-3 py-2 text-gray-600 hover:text-primary transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    Tìm thuốc
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
