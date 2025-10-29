'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { publicApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Star, 
  Award, 
  TrendingUp, 
  Clock, 
  Users,
  Sparkles,
  Activity,
  Shield
} from 'lucide-react';

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === 'object' && err !== null) {
    const maybe = err as { response?: { data?: { message?: string } } };
    const msgFromResponse = maybe.response?.data?.message;
    if (typeof msgFromResponse === 'string' && msgFromResponse.length > 0) return msgFromResponse;
    const maybeMsg = (err as { message?: unknown }).message;
    if (typeof maybeMsg === 'string' && maybeMsg.length > 0) return maybeMsg;
  }
  return fallback;
}

type PublicDoctor = {
  id: string;
  name: string;
  avatar?: string;
  doctor: {
    id: string;
    doctorCode: string;
    yearsExperience?: number;
    rating?: number;
    workHistory?: string;
    description?: string;
    specialty: { id: string; specialtyCode: string; name: string };
  };
};

export default function DoctorsPage() {
  const [data, setData] = useState<PublicDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specialtyName, setSpecialtyName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await publicApi.getDoctors(
          specialtyName ? { specialtyName } : undefined
        );
        setData(res.data || []);
      } catch (e: unknown) {
        setError(getErrorMessage(e, 'Không thể tải danh sách bác sĩ'));
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [specialtyName]);

  useEffect(() => {
    // Reset to first page when filter changes
    setCurrentPage(1);
  }, [specialtyName]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(data.length / itemsPerPage)), [data.length]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex]);
  const currentDoctors = useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-[#f0f9ff] to-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-50 to-transparent rounded-full blur-2xl"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Đội ngũ chuyên nghiệp
              </Badge>
              <Badge variant="outline" className="border-green-200 text-green-700">
                <Activity className="h-3 w-3 mr-1" />
                Luôn sẵn sàng
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
              Đội ngũ bác sĩ <span className="text-primary relative">
                giàu kinh nghiệm
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full"></div>
              </span>
            </h1>
            <p className="mt-3 text-gray-600 text-base sm:text-lg max-w-3xl mx-auto">
              Tìm bác sĩ phù hợp theo chuyên khoa và đặt lịch khám nhanh chóng với đội ngũ chuyên gia hàng đầu.
            </p>
            
            
          </div>
        </div>
      </section>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className=" mx-auto">
          <div className="text-center mb-4"></div>

          <div className="max-w-2xl mx-auto mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Lọc theo chuyên khoa (vd: Tim mạch)"
                value={specialtyName}
                onChange={(e) => setSpecialtyName(e.target.value)}
                className="pl-10 pr-4 py-5 border-gray-300 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {loading ? 'Đang tải...' : `${data.length} bác sĩ`}
              </span>
            </div>
            {specialtyName && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Shield className="h-3 w-3 mr-1" />
                Đã lọc
              </Badge>
            )}
          </div>

          <div className="space-y-6">
            {currentDoctors.map((d) => (
              <Card key={d.id} className="border border-gray-200 w-full mx-auto bg-white hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl opacity-50"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-40 h-40 sm:w-40 sm:h-40 rounded-xl overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform duration-300 ">
                        <Image
                          unoptimized
                          src={d.avatar || '/logos/LogoRevita-v2-noneBG.png'}
                          alt={d.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{d.name}</h3>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {d.doctor.specialty?.name}
                        </Badge>
                        {d.doctor.yearsExperience !== undefined && (
                          <Badge variant="outline" className="border-amber-200 text-amber-700">
                            <Award className="h-3 w-3 mr-1" />
                            {d.doctor.yearsExperience}+ năm
                          </Badge>
                        )}
                        {typeof d.doctor.rating === 'number' && (
                          <Badge variant="outline" className="border-yellow-200 text-yellow-700">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            {d.doctor.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <p className="text-xs text-gray-500 font-medium">Mã bác sĩ</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{d.doctor.doctorCode}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-xs text-gray-500 font-medium">Chuyên khoa</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{d.doctor.specialty?.name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {d.doctor.workHistory && (
                          <div className="flex items-start gap-3">
                            <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Kinh nghiệm</p>
                              <p className="text-sm text-gray-600">{d.doctor.workHistory}</p>
                            </div>
                          </div>
                        )}
                        {d.doctor.description && (
                          <div className="flex items-start gap-3">
                            <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Giới thiệu</p>
                              <p className="text-sm text-gray-600">{d.doctor.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {loading && (
            <div className="text-center text-sm text-gray-500 mt-6">Đang tải...</div>
          )}
          {!loading && !error && data.length === 0 && (
            <div className="text-center text-sm text-gray-500 mt-6">Không có bác sĩ phù hợp</div>
          )}
          {error && (
            <div className="text-center text-sm text-red-600 mt-6">{error}</div>
          )}

          {/* Pagination */}
          {!loading && data.length > 0 && (
            <div className="mt-8 mb-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


