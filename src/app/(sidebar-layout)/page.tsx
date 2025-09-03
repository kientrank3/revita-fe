import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, CalendarDays, ChartColumn, Library, Users, Bell, Activity, UserCheck, FileText, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="p-6 space-y-6 ">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
        <p className="text-gray-600">Tổng quan hệ thống quản lý y tế</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12 so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bệnh án mới</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              +5 so với tuần trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lịch hẹn hôm nay</CardTitle>
            <CalendarDays className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              8 lịch hẹn đã hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên hoạt động</CardTitle>
            <UserCheck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              3 người đang nghỉ phép
            </p>
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
              Những hoạt động mới nhất trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Bệnh án mới được tạo</p>
                <p className="text-xs text-gray-500">Bệnh nhân: Nguyễn Văn A - 2 giờ trước</p>
              </div>
              <Badge variant="secondary">Mới</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Lịch hẹn được cập nhật</p>
                <p className="text-xs text-gray-500">Phòng khám 2 - 1 giờ trước</p>
              </div>
              <Badge variant="secondary">Cập nhật</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Báo cáo tháng được tạo</p>
                <p className="text-xs text-gray-500">Báo cáo tháng 12/2024 - 3 giờ trước</p>
              </div>
              <Badge variant="secondary">Báo cáo</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Người dùng mới đăng ký</p>
                <p className="text-xs text-gray-500">Dr. Trần Thị B - 4 giờ trước</p>
              </div>
              <Badge variant="secondary">Mới</Badge>
            </div>
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
            <Button className="w-full justify-start" variant="outline">
              <CalendarDays className="mr-2 h-4 w-4" />
              Xem lịch hẹn hôm nay
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <Library className="mr-2 h-4 w-4" />
              Tạo bệnh án mới
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <ChartColumn className="mr-2 h-4 w-4" />
              Xem báo cáo
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Quản lý người dùng
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
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Nguyễn Thị C</p>
                  <p className="text-sm text-gray-500">Khám tổng quát</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">09:00</p>
                <p className="text-sm text-gray-500">Phòng 1</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Lê Văn D</p>
                  <p className="text-sm text-gray-500">Tái khám</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">10:30</p>
                <p className="text-sm text-gray-500">Phòng 2</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Phạm Thị E</p>
                  <p className="text-sm text-gray-500">Xét nghiệm</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">14:00</p>
                <p className="text-sm text-gray-500">Phòng XN</p>
              </div>
            </div>
          </div>
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
                <span className="text-sm">Bệnh án chờ xử lý</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Lịch hẹn tuần này</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Nhân viên online</span>
                <span className="font-medium">8</span>
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
                <span className="text-sm">3 thông báo mới</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                <span className="text-sm">5 lịch hẹn sắp tới</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm">2 bệnh án cần duyệt</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
