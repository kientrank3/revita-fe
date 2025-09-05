"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, CalendarDays, ChartColumn, Library, Users, Bell, Activity, UserCheck, FileText, Clock, Loader2 } from "lucide-react";
import { medicalRecordService } from "@/lib/services/medical-record.service";
import { userService } from "@/lib/services/user.service";
import type { MedicalRecord } from "@/lib/types/medical-record";
import type { User } from "@/lib/types/user";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [usersResult, setUsersResult] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [records, usersSearch] = await Promise.all([
          medicalRecordService.getAll(),
          userService.searchUsers("patient"),
        ]);
        setMedicalRecords(records);
        setUsersResult(usersSearch.users || []);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Không thể tải dữ liệu";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const totalPatients = useMemo(() => usersResult.filter(u => u.role === "PATIENT").length, [usersResult]);
  const totalMedicalRecords = medicalRecords.length;
  const todayAppointments = 0; // Chưa có API lịch hẹn
  const activeStaff = usersResult.filter(u => u.role === "DOCTOR" || u.role === "RECEPTIONIST" || u.role === "ADMIN").length;

  const recentActivities = useMemo(() => {
    const items = [...medicalRecords]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        title: "Bệnh án mới/được cập nhật",
        description: `Hồ sơ: ${r.patientProfileId} • Loại: ${r.templateId}`,
        createdAt: r.createdAt,
      }));
    return items;
  }, [medicalRecords]);

  return (
    <div className="px-8 py-6 space-y-6 bg-white">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
        <p className="text-gray-600">Tổng quan hoạt động trong hệ thống</p>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : totalPatients}
            </div>
            <p className="text-xs text-muted-foreground">Người dùng có vai trò bệnh nhân</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bệnh án</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : totalMedicalRecords}
            </div>
            <p className="text-xs text-muted-foreground">Tổng số bệnh án trong hệ thống</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lịch hẹn hôm nay</CardTitle>
            <CalendarDays className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments}</div>
            <p className="text-xs text-muted-foreground">Chưa tích hợp lịch hẹn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên hoạt động</CardTitle>
            <UserCheck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : activeStaff}
            </div>
            <p className="text-xs text-muted-foreground">Nhân sự có quyền truy cập</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Hoạt động gần đây
            </CardTitle>
            <CardDescription>
              Những thay đổi gần đây của bệnh án
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải hoạt động...
              </div>
            )}
            {!isLoading && recentActivities.length === 0 && (
              <div className="text-sm text-gray-500">Chưa có hoạt động nào</div>
            )}
            {!isLoading && recentActivities.map((a, idx) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-green-500" : "bg-blue-500"}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.description}</p>
                </div>
                <Badge variant="secondary">{new Date(a.createdAt).toLocaleString("vi-VN")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-500" />
              Hành động nhanh
            </CardTitle>
            <CardDescription>
              Truy cập nhanh các chức năng chính
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/medical-records">
                <Library className="mr-2 h-4 w-4" />
                Quản lý bệnh án
              </Link>
            </Button>
            
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/medical-records/create">
                <FileText className="mr-2 h-4 w-4" />
                Tạo bệnh án mới
              </Link>
            </Button>
            
            <Button disabled className="w-full justify-start" variant="outline">
              <ChartColumn className="mr-2 h-4 w-4" />
              Xem báo cáo (sắp có)
            </Button>
            
            <Button disabled className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Quản lý người dùng (sắp có)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Lịch hẹn hôm nay
          </CardTitle>
          <CardDescription>
            Danh sách các lịch hẹn trong ngày
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-500">Chưa tích hợp lịch hẹn</div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trạng thái hệ thống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Server</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backup System</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Online</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Thống kê nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Bệnh án</span>
                <span className="font-medium">{isLoading ? "…" : totalMedicalRecords}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bệnh nhân</span>
                <span className="font-medium">{isLoading ? "…" : totalPatients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Nhân sự</span>
                <span className="font-medium">{isLoading ? "…" : activeStaff}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Thông báo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-500" />
                <span className="text-sm">{isLoading ? "Đang tải..." : "Không có thông báo"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Tính năng lịch hẹn đang phát triển</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm">Báo cáo sẽ có sớm</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
