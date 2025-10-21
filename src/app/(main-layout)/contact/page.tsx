'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Send,
  MessageCircle,
  Users,
  Award,
  Shield,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Liên hệ với <span className="text-primary">chúng tôi</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với chúng tôi để được tư vấn và hỗ trợ tốt nhất.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1  gap-16">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Thông tin liên hệ</h2>
                
                {/* Contact Cards */}
                <div className="space-y-6 grid grid-cols-3 gap-4">
                  <Card className="border h-44 border-gray-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Phone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">Điện thoại</h3>
                          <p className="text-gray-600">Hotline: <span className="font-medium text-primary">1900 1234</span></p>
                          <p className="text-gray-600">Tư vấn: <span className="font-medium">024 1234 5678</span></p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border h-44 border-gray-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">Email</h3>
                          <p className="text-gray-600">Hỗ trợ: <span className="font-medium text-primary">support@revita.com</span></p>
                          <p className="text-gray-600">Liên hệ: <span className="font-medium">contact@revita.com</span></p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border h-44 border-gray-200 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">Địa chỉ</h3>
                          <p className="text-gray-600">Trụ sở chính: <span className="font-medium">Đường Nguyễn Văn Bảo, Quận Gò Vấp, TP.HCM</span></p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                 
                </div>
              </div>

            </div>

            {/* Contact Form */}
            <div>
              <Card className="border border-gray-200 shadow-sm p-0">
                <CardHeader className="bg-gray-50 px-6 py-4">
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Gửi tin nhắn cho chúng tôi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Họ và tên *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Nhập họ và tên"
                          className="border-gray-300 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Nhập email"
                          className="border-gray-300 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Số điện thoại
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Nhập số điện thoại"
                          className="border-gray-300 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                          Chủ đề *
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="Nhập chủ đề"
                          className="border-gray-300 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung tin nhắn *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Nhập nội dung tin nhắn của bạn..."
                        className="border-gray-300 focus:border-primary focus:ring-primary/20"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Gửi tin nhắn
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tại sao chọn Revita?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Chúng tôi cam kết mang đến dịch vụ y tế chất lượng cao với đội ngũ chuyên gia giàu kinh nghiệm
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center p-8 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Đội ngũ chuyên gia</h3>
                <p className="text-gray-600">
                  Hơn 200 bác sĩ chuyên khoa giàu kinh nghiệm, luôn sẵn sàng phục vụ
                </p>
              </Card>

              <Card className="text-center p-8 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Chất lượng dịch vụ</h3>
                <p className="text-gray-600">
                  Tiêu chuẩn quốc tế với trang thiết bị hiện đại và quy trình chuyên nghiệp
                </p>
              </Card>

              <Card className="text-center p-8 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bảo mật thông tin</h3>
                <p className="text-gray-600">
                  Hệ thống bảo mật cao, đảm bảo thông tin cá nhân và hồ sơ bệnh án an toàn
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
