"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  FileText, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  UserCheck,
  Clock,
  Activity
} from "lucide-react";
import { KPIData } from "@/lib/types/statistics";
import { formatCurrency, formatNumber, formatPercentage, getGrowthColor, getGrowthIcon } from "@/lib/services/statistics";

interface StatisticsCardsProps {
  data: KPIData | null;
  loading: boolean;
  error: string | null;
}

export function StatisticsCards({ data, loading, error }: StatisticsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <Activity className="h-5 w-5" />
            <p className="font-medium">Lỗi tải dữ liệu</p>
          </div>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { appointmentStats, patientStats, doctorRatingStats } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Patients */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Tổng bệnh nhân
          </CardTitle>
          <Users className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(patientStats.totalPatients)}
          </div>
          <p className="text-xs text-green-600 flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {formatPercentage(patientStats.newPatientsPercent)} bệnh nhân mới
          </p>
        </CardContent>
      </Card>

      {/* Medical Records */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Hồ sơ bệnh án
          </CardTitle>
          <FileText className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(appointmentStats.total)}
          </div>
          <p className="text-xs text-blue-500 flex items-center mt-1">
            <Clock className="h-3 w-3 mr-1" />
            {formatPercentage(appointmentStats.completedPercent)} đã hoàn thành
          </p>
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Lịch hẹn hôm nay
          </CardTitle>
          <Calendar className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(appointmentStats.total)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              {appointmentStats.confirmed} đã xác nhận
            </Badge>
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
              {appointmentStats.pending} chờ xác nhận
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Rating */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Đánh giá bác sĩ
          </CardTitle>
          <UserCheck className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {doctorRatingStats.averageRating.toFixed(1)}/5.0
          </div>
          <p className="text-xs text-gray-500 flex items-center mt-1">
            <UserCheck className="h-3 w-3 mr-1" />
            {doctorRatingStats.activeDoctors}/{doctorRatingStats.totalDoctors} bác sĩ đang hoạt động
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Additional detailed statistics cards
export function DetailedStatisticsCards({ data, loading, error }: StatisticsCardsProps) {
  if (loading || error || !data) {
    return null;
  }

  const { appointmentStats, patientStats } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {/* Appointment Status Breakdown */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Trạng thái lịch hẹn
          </CardTitle>
          <CardDescription>
            Phân tích chi tiết các lịch hẹn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Đã hoàn thành</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{appointmentStats.completed}</span>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                {formatPercentage(appointmentStats.completedPercent)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Đã xác nhận</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{appointmentStats.confirmed}</span>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                {formatPercentage(appointmentStats.confirmedPercent)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Đã hủy</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{appointmentStats.cancelled}</span>
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                {formatPercentage(appointmentStats.cancelledPercent)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Chờ xác nhận</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{appointmentStats.pending}</span>
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                {formatPercentage(100 - appointmentStats.confirmedPercent)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Type Breakdown */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Loại bệnh nhân
          </CardTitle>
          <CardDescription>
            Phân loại bệnh nhân mới và cũ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Bệnh nhân mới</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{patientStats.newPatients}</span>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                {formatPercentage(patientStats.newPatientsPercent)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Bệnh nhân cũ</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{patientStats.returningPatients}</span>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                {formatPercentage(patientStats.returningPatientsPercent)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Thao tác nhanh
          </CardTitle>
          <CardDescription>
            Các thao tác thường dùng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900">Lịch hẹn</p>
              <p className="text-xs text-blue-600">{appointmentStats.total}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">Bệnh nhân</p>
              <p className="text-xs text-green-600">{patientStats.totalPatients}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
