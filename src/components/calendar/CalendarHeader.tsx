'use client';

import { Button } from '@/components/ui/button';
import { CalendarPlus, RefreshCw } from 'lucide-react';

interface CalendarHeaderProps {
  loading?: boolean;
  onRefresh: () => void;
  onCreateNew: () => void;
}

export function CalendarHeader({ loading, onRefresh, onCreateNew }: CalendarHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#35b8cf]">
          Lịch làm việc
        </h1>
        <p className="text-gray-600">
          Quản lý và đăng ký lịch làm việc cho bác sĩ
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="border-gray-300 hover:bg-gray-50 hover:border-gray-400"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
        
        <Button
          onClick={onCreateNew}
          disabled={loading}
          className="bg-[#35b8cf] hover:bg-[#2a9bb5] text-white"
        >
          <CalendarPlus className="h-4 w-4 mr-2" />
          Tạo lịch mới
        </Button>
      </div>
    </div>
  );
}
