"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ChevronDown, User, Download, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const medicalFacilities = [
  "Bệnh viện công",
  "Bệnh viện tư",
  "Phòng khám",
  "Phòng mạch",
  "Xét nghiệm",
  "Y tế tại nhà",
  "Tiêm chủng",
];

const medicalServices = [
  "Đặt khám tại cơ sở",
  "Đặt khám chuyên khoa",
  "Gọi video với bác sĩ",
  "Đặt khám theo bác sĩ",
  "Mua thuốc tại An Khang",
  "Đặt lịch xét nghiệm",
  "Gói khám sức khỏe",
  "Y tế tại nhà",
  "Đặt lịch tiêm chủng",
  "Đặt khám ngoài giờ",
  "Khám sức khỏe thông tư",
];

const news = ["Tin dịch vụ", "Tin y tế", "Y học thường thức"];

const guides = [
  "Cài đặt ứng dụng",
  "Đặt lịch khám",
  "Tư vấn khám bệnh qua video",
  "Quy trình hoàn phí",
  "Câu hỏi thường gặp",
  "Quy trình đi khám",
];

const partnerships = [
  "Cơ sở y tế",
  "Phòng mạch",
  "Quảng cáo",
  "Tuyển dụng",
  "Về Revita",
];

const socialLinks = [
  { name: "TikTok", icon: "/socials/tiktok.svg", href: "#" },
  { name: "Facebook", icon: "/socials/facebook.svg", href: "#" },
  { name: "Zalo", icon: "/socials/zalo.svg", href: "#" },
  { name: "Youtube", icon: "/socials/youtube.svg", href: "#" },
];

// Hover Dropdown Component
function HoverDropdown({
  trigger,
  children,
  className = "w-64",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className={isOpen ? "text-primary" : ""}>{trigger}</div>
      {isOpen && (
        <div
          className={`absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Mobile Dropdown Component
function MobileDropdown({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 pb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 font-medium text-gray-900"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="pl-4 space-y-1 mt-2">{children}</div>}
    </div>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      {/* Top Bar - Hidden on small screens */}
      <div className="hidden lg:block bg-white py-2 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Social Links */}
          <div className="flex items-center space-x-6">
            {socialLinks.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-primary transition-colors"
              >
                <Image
                  src={social.icon}
                  alt={social.name}
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
                <span className="font-medium">{social.name}</span>
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-full px-4 py-1 text-xs font-medium"
            >
              <Download className="w-3 h-3 mr-1" />
              Tải ứng dụng
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white border-0 rounded-full px-4 py-1 text-xs font-medium"
              asChild
            >
              <Link href="/login">
                <User className="w-3 h-3 mr-1" />
                Tài khoản
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-full px-3 py-1 text-xs"
                >
                  🇻🇳
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>🇻🇳 Tiếng Việt</DropdownMenuItem>
                <DropdownMenuItem>🇺🇸 English</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logos/LogoRevita-v2-noneBG.png"
              alt="Revita"
              width={140}
              height={45}
              className="h-8 md:h-10 lg:h-12 w-auto"
            />
          </Link>

          {/* Desktop Content */}
          <div className="hidden lg:flex items-center gap-8 flex-1">
            {/* Search Bar */}
            <div className="flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Tìm"
                  className="pl-10 bg-gray-50 border-gray-200 rounded-full h-9 text-sm w-full"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="flex items-center space-x-1">
              {/* Cơ sở y tế */}
              <HoverDropdown
                className="w-64"
                trigger={
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-gray-700 hover:[white] px-3 py-2 h-auto"
                  >
                    Cơ sở y tế
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                }
              >
                <div className="p-4">
                  {medicalFacilities.map((item) => (
                    <Link
                      key={item}
                      href="#"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </HoverDropdown>

              {/* Dịch vụ y tế */}
              <HoverDropdown
                className="w-96"
                trigger={
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-gray-700 hover:[white] px-3 py-2 h-auto"
                  >
                    Dịch vụ y tế
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                }
              >
                <div className="p-4 grid grid-cols-2 gap-1">
                  {medicalServices.map((item) => (
                    <Link
                      key={item}
                      href="#"
                      className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary rounded transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </HoverDropdown>

              {/* Khám sức khỏe doanh nghiệp */}
              <Button
                variant="ghost"
                className="text-sm font-medium text-gray-700 hover:[white] px-3 py-2 h-auto"
                asChild
              >
                <Link href="/kham-suc-khoe-doanh-nghiep">
                  Khám sức khỏe doanh nghiệp
                </Link>
              </Button>

              {/* Tin tức */}
              <HoverDropdown
                className="w-48"
                trigger={
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-gray-700 hover:[white] px-3 py-2 h-auto"
                  >
                    Tin tức
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                }
              >
                <div className="p-4">
                  {news.map((item) => (
                    <Link
                      key={item}
                      href="#"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </HoverDropdown>

              {/* Hướng dẫn */}
              <HoverDropdown
                className="w-64"
                trigger={
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-gray-700 hover:[white] px-3 py-2 h-auto"
                  >
                    Hướng dẫn
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                }
              >
                <div className="p-4">
                  {guides.map((item) => (
                    <Link
                      key={item}
                      href="#"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </HoverDropdown>

              {/* Liên hệ hợp tác */}
              <HoverDropdown
                className="w-48"
                trigger={
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-gray-700 hover:[white] px-3 py-2 h-auto"
                  >
                    Liên hệ hợp tác
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                }
              >
                <div className="p-4">
                  {partnerships.map((item) => (
                    <Link
                      key={item}
                      href="#"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </HoverDropdown>
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Tìm"
                className="pl-10 bg-gray-50 border-gray-200 rounded-full h-9 text-sm w-full"
              />
            </div>

            {/* Mobile Navigation */}
            <div className="space-y-2">
              <MobileDropdown title="Cơ sở y tế">
                {medicalFacilities.map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="block py-1 text-sm text-gray-600 hover:text-primary"
                  >
                    {item}
                  </Link>
                ))}
              </MobileDropdown>

              <MobileDropdown title="Dịch vụ y tế">
                <div className="grid grid-cols-2 gap-1">
                  {medicalServices.map((item) => (
                    <Link
                      key={item}
                      href="#"
                      className="block py-1 text-xs text-gray-600 hover:text-primary"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </MobileDropdown>

              <Link
                href="/kham-suc-khoe-doanh-nghiep"
                className="block py-2 font-medium text-gray-900 border-b border-gray-100"
              >
                Khám sức khỏe doanh nghiệp
              </Link>

              <MobileDropdown title="Tin tức">
                {news.map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="block py-1 text-sm text-gray-600 hover:text-primary"
                  >
                    {item}
                  </Link>
                ))}
              </MobileDropdown>

              <MobileDropdown title="Hướng dẫn">
                {guides.map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="block py-1 text-sm text-gray-600 hover:text-primary"
                  >
                    {item}
                  </Link>
                ))}
              </MobileDropdown>

              <MobileDropdown title="Liên hệ hợp tác">
                {partnerships.map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="block py-1 text-sm text-gray-600 hover:text-primary"
                  >
                    {item}
                  </Link>
                ))}
              </MobileDropdown>

              {/* Mobile Social & Actions */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                {/* Social Links */}
                <div>
                  <p className="font-medium text-gray-900 mb-2">
                    Theo dõi chúng tôi
                  </p>
                  <div className="flex items-center space-x-4">
                    {socialLinks.map((social) => (
                      <Link
                        key={social.name}
                        href={social.href}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary"
                      >
                        <Image
                          src={social.icon}
                          alt={social.name}
                          width={16}
                          height={16}
                          className="w-4 h-4"
                        />
                        <span>{social.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full">
                    <Download className="w-4 h-4 mr-2" />
                    Tải ứng dụng
                  </Button>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full">
                    <User className="w-4 h-4 mr-2" />
                    Tài khoản
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full rounded-full">
                        🇻🇳 Tiếng Việt
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem>🇻🇳 Tiếng Việt</DropdownMenuItem>
                      <DropdownMenuItem>🇺🇸 English</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
