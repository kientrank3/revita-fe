import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatbotFAB } from "@/components/chatbot/ChatbotFAB";
import { 
  Users, 
  FileText, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Activity,
  UserCheck,
  Clock
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="px-8 py-6 bg-white space-y-6 h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Tổng quan hệ thống và thống kê</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng bệnh nhân
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">1,234</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hồ sơ bệnh án
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">856</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lịch hẹn hôm nay
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">42</div>
            <p className="text-xs text-blue-500 flex items-center mt-1">
              <Clock className="h-3 w-3 mr-1" />
              15 lịch sắp tới
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Doanh thu tháng
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₫125.4M</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +23% so với tháng trước
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Bệnh nhân mới đăng ký</p>
                <p className="text-xs text-gray-500">Nguyễn Văn A - 5 phút trước</p>
              </div>
              <Badge variant="outline" className="text-xs">Mới</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Hồ sơ bệnh án được cập nhật</p>
                <p className="text-xs text-gray-500">Bệnh nhân ID: 12345 - 15 phút trước</p>
              </div>
              <Badge variant="outline" className="text-xs">Cập nhật</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Lịch hẹn mới được tạo</p>
                <p className="text-xs text-gray-500">Dr. Nguyễn Thị B - 30 phút trước</p>
              </div>
              <Badge variant="outline" className="text-xs">Lịch hẹn</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Thanh toán hoàn tất</p>
                <p className="text-xs text-gray-500">Hóa đơn #INV-001 - 1 giờ trước</p>
              </div>
              <Badge variant="outline" className="text-xs">Thanh toán</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-gray-600" />
              Bác sĩ trực
            </CardTitle>
            <CardDescription>
              Danh sách bác sĩ đang làm việc
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">NV</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Dr. Nguyễn Văn A</p>
                <p className="text-xs text-gray-500">Khoa Nội tổng hợp</p>
              </div>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Đang trực
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">TB</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Dr. Trần Thị B</p>
                <p className="text-xs text-gray-500">Khoa Ngoại</p>
              </div>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Đang trực
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">LC</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Dr. Lê Văn C</p>
                <p className="text-xs text-gray-500">Khoa Tim mạch</p>
              </div>
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                Nghỉ trưa
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">PD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Dr. Phạm Thị D</p>
                <p className="text-xs text-gray-500">Khoa Nhi</p>
              </div>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Đang trực
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      <ChatbotFAB />
    </div>
  );
}
