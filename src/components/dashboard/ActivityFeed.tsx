"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, UserPlus, FileText, Calendar, CreditCard } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'patient_registration' | 'medical_record' | 'appointment' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  status: 'new' | 'updated' | 'completed' | 'pending';
}

interface ActivityFeedProps {
  loading?: boolean;
}

// Mock data for demonstration - in real app, this would come from API
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'patient_registration',
    title: 'Bệnh nhân mới đăng ký',
    description: 'Nguyễn Văn A - 5 phút trước',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'new'
  },
  {
    id: '2',
    type: 'medical_record',
    title: 'Hồ sơ bệnh án được cập nhật',
    description: 'Bệnh nhân ID: 12345 - 15 phút trước',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'updated'
  },
  {
    id: '3',
    type: 'appointment',
    title: 'Lịch hẹn mới được tạo',
    description: 'Dr. Nguyễn Thị B - 30 phút trước',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'new'
  },
  {
    id: '4',
    type: 'payment',
    title: 'Thanh toán hoàn tất',
    description: 'Hóa đơn #INV-001 - 1 giờ trước',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'completed'
  }
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'patient_registration':
      return <UserPlus className="h-4 w-4 text-green-600" />;
    case 'medical_record':
      return <FileText className="h-4 w-4 text-blue-600" />;
    case 'appointment':
      return <Calendar className="h-4 w-4 text-purple-600" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-orange-600" />;
    default:
      return <Activity className="h-4 w-4 text-gray-600" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'patient_registration':
      return 'bg-green-500';
    case 'medical_record':
      return 'bg-blue-500';
    case 'appointment':
      return 'bg-purple-500';
    case 'payment':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'new':
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Mới</Badge>;
    case 'updated':
      return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Cập nhật</Badge>;
    case 'completed':
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Hoàn thành</Badge>;
    case 'pending':
      return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Chờ xử lý</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Khác</Badge>;
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa xong';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }
};

export function ActivityFeed({ loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            Hoạt động gần đây
          </CardTitle>
          <CardDescription>
            Các hoạt động mới nhất trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="w-2 h-2 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-600" />
          Hoạt động gần đây
        </CardTitle>
        <CardDescription>
          Các hoạt động mới nhất trong hệ thống
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-4">
            <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`}></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {getActivityIcon(activity.type)}
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
            </div>
            {getStatusBadge(activity.status)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Online Staff Component
interface OnlineStaff {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'online' | 'busy' | 'break' | 'offline';
  avatar?: string;
}

interface OnlineStaffProps {
  loading?: boolean;
}

const mockOnlineStaff: OnlineStaff[] = [
  {
    id: '1',
    name: 'Dr. Nguyễn Văn A',
    role: 'Bác sĩ',
    department: 'Khoa Nội tổng hợp',
    status: 'online',
    avatar: 'NV'
  },
  {
    id: '2',
    name: 'Dr. Trần Thị B',
    role: 'Bác sĩ',
    department: 'Khoa Ngoại',
    status: 'online',
    avatar: 'TB'
  },
  {
    id: '3',
    name: 'Dr. Lê Văn C',
    role: 'Bác sĩ',
    department: 'Khoa Tim mạch',
    status: 'break',
    avatar: 'LC'
  },
  {
    id: '4',
    name: 'Dr. Phạm Thị D',
    role: 'Bác sĩ',
    department: 'Khoa Nhi',
    status: 'online',
    avatar: 'PD'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'busy':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'break':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'offline':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'online':
      return 'Đang trực';
    case 'busy':
      return 'Bận';
    case 'break':
      return 'Nghỉ trưa';
    case 'offline':
      return 'Không trực';
    default:
      return 'Không xác định';
  }
};

export function OnlineStaff({ loading = false }: OnlineStaffProps) {
  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            Bác sĩ trực
          </CardTitle>
          <CardDescription>
            Danh sách bác sĩ đang làm việc
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-600" />
          Bác sĩ trực
        </CardTitle>
        <CardDescription>
          Danh sách bác sĩ đang làm việc
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockOnlineStaff.map((staff) => (
          <div key={staff.id} className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">{staff.avatar}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{staff.name}</p>
              <p className="text-xs text-gray-500">{staff.department}</p>
            </div>
            <Badge variant="outline" className={`text-xs ${getStatusColor(staff.status)}`}>
              {getStatusLabel(staff.status)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
