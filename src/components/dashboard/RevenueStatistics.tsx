"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet
} from "lucide-react";
import { RevenueData, PaymentMethodData } from "@/lib/types/statistics";
import { formatCurrency, formatPercentage } from "@/lib/services/statistics";

interface RevenueStatisticsProps {
  data: RevenueData | null;
  loading: boolean;
  error: string | null;
}

export function RevenueStatistics({ data, loading, error }: RevenueStatisticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
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
            <DollarSign className="h-5 w-5" />
            <p className="font-medium">Lỗi tải dữ liệu doanh thu</p>
          </div>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { overview, bySpecialty, byService } = data;

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            Tổng quan doanh thu
          </CardTitle>
          <CardDescription>
            Thống kê doanh thu tổng thể trong kỳ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Revenue */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(overview.totalRevenue)}
              </div>
              <p className="text-sm text-blue-600 mt-1">Tổng doanh thu</p>
            </div>

            {/* Paid Revenue */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(overview.paidRevenue)}
              </div>
              <p className="text-sm text-green-600 mt-1">Đã thanh toán</p>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 mt-1">
                {formatPercentage(overview.paidPercent)}
              </Badge>
            </div>

            {/* Accounts Receivable */}
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-900">
                {formatCurrency(overview.accountsReceivable)}
              </div>
              <p className="text-sm text-yellow-600 mt-1">Công nợ</p>
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 mt-1">
                {formatPercentage(overview.arPercent)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Specialty and Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Specialty */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Doanh thu theo khoa
            </CardTitle>
            <CardDescription>
              Phân tích doanh thu theo từng khoa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bySpecialty.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Chưa có dữ liệu doanh thu theo khoa</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bySpecialty.slice(0, 5).map((specialty, index) => (
                  <div key={specialty.specialtyId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {specialty.specialtyName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {specialty.appointmentCount} lịch hẹn
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(specialty.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Doanh thu theo dịch vụ
            </CardTitle>
            <CardDescription>
              Top dịch vụ có doanh thu cao nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            {byService.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Chưa có dữ liệu doanh thu theo dịch vụ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {byService.slice(0, 5).map((service, index) => (
                  <div key={service.serviceId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {service.serviceName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {service.usageCount} lần sử dụng
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(service.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Payment Method Statistics Component
interface PaymentMethodStatisticsProps {
  data: PaymentMethodData | null;
  loading: boolean;
  error: string | null;
}

export function PaymentMethodStatistics({ data, loading, error }: PaymentMethodStatisticsProps) {
  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="h-5 w-5 text-green-600" />;
      case 'CARD':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'TRANSFER':
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      case 'WALLET':
        return <Smartphone className="h-5 w-5 text-orange-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Tiền mặt';
      case 'CARD':
        return 'Thẻ';
      case 'TRANSFER':
        return 'Chuyển khoản';
      case 'WALLET':
        return 'Ví điện tử';
      default:
        return method;
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gray-600" />
          Phương thức thanh toán
        </CardTitle>
        <CardDescription>
          Thống kê doanh thu theo phương thức thanh toán
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.byPaymentMethod.map((method) => (
            <div key={method.paymentMethod} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {getPaymentMethodIcon(method.paymentMethod)}
                <span className="text-sm font-medium text-gray-900">
                  {getPaymentMethodLabel(method.paymentMethod)}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                {formatCurrency(method.revenue)}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{method.invoiceCount} hóa đơn</span>
                <Badge variant="outline" className="text-xs">
                  {formatPercentage(method.paidPercent)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
