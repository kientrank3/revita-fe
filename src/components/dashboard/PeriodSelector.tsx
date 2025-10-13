"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";
import { PeriodType } from "@/lib/types/statistics";
import { getPeriodLabel } from "@/lib/services/statistics";

interface PeriodSelectorProps {
  period: PeriodType;
  customStartDate: string;
  customEndDate: string;
  onPeriodChange: (period: PeriodType) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  loading?: boolean;
}

export function PeriodSelector({
  period,
  customStartDate,
  customEndDate,
  onPeriodChange,
  onCustomDateChange,
  loading = false
}: PeriodSelectorProps) {
  const periods: { value: PeriodType; label: string }[] = [
    { value: 'day', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
    { value: 'custom', label: 'Tùy chỉnh' },
  ];

  const handleCustomStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomDateChange(e.target.value, customEndDate);
  };

  const handleCustomEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomDateChange(customStartDate, e.target.value);
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          Chọn khoảng thời gian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Period Buttons */}
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => onPeriodChange(p.value)}
                disabled={loading}
                className={period === p.value ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-medium">
                  Từ ngày
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={handleCustomStartDateChange}
                  disabled={loading}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-medium">
                  Đến ngày
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={handleCustomEndDateChange}
                  disabled={loading}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Current Selection Display */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              Đang hiển thị: <span className="font-medium">{getPeriodLabel(period)}</span>
              {period === 'custom' && customStartDate && customEndDate && (
                <span className="ml-1">
                  ({new Date(customStartDate).toLocaleDateString('vi-VN')} - {new Date(customEndDate).toLocaleDateString('vi-VN')})
                </span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
