
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Heart, 
  Shield, 
  Users, 
  Calendar, 
  Phone, 
  MapPin
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Chăm sóc sức khỏe
              <span className="text-primary block">tận tâm, chuyên nghiệp</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Hệ thống quản lý bệnh viện toàn diện, kết nối bác sĩ và bệnh nhân một cách hiệu quả
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn Revita?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cung cấp giải pháp toàn diện cho việc quản lý bệnh viện và chăm sóc sức khỏe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Chăm sóc tận tâm</CardTitle>
                <CardDescription>
                  Đội ngũ bác sĩ giàu kinh nghiệm, luôn đặt sức khỏe bệnh nhân lên hàng đầu
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Bảo mật thông tin</CardTitle>
                <CardDescription>
                  Hệ thống bảo mật cao, đảm bảo thông tin cá nhân và hồ sơ bệnh án được bảo vệ tuyệt đối
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Quản lý hiệu quả</CardTitle>
                <CardDescription>
                  Hệ thống quản lý toàn diện, giúp tối ưu hóa quy trình làm việc và nâng cao chất lượng dịch vụ
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Đặt lịch dễ dàng</CardTitle>
                <CardDescription>
                  Đặt lịch khám bệnh trực tuyến, tiết kiệm thời gian và thuận tiện cho bệnh nhân
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Hỗ trợ 24/7</CardTitle>
                <CardDescription>
                  Đội ngũ hỗ trợ khách hàng luôn sẵn sàng giải đáp mọi thắc mắc và hỗ trợ khi cần thiết
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Vị trí thuận tiện</CardTitle>
                <CardDescription>
                  Bệnh viện đặt tại vị trí trung tâm, dễ dàng di chuyển và tiếp cận các dịch vụ y tế
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-gray-600">Bệnh nhân đã tin tưởng</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-600">Bác sĩ chuyên khoa</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600">Hỗ trợ khách hàng</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99%</div>
              <div className="text-gray-600">Hài lòng khách hàng</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu hành trình chăm sóc sức khỏe?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Đăng ký ngay để trải nghiệm dịch vụ chăm sóc sức khỏe tốt nhất
          </p>
        </div>
      </section>
    </div>
  );
}
