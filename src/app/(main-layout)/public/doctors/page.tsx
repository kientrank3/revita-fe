'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { publicApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

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
      <section className="bg-gradient-to-b from-blue-50 to-white ">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Đội ngũ bác sĩ giàu kinh nghiệm</h1>
            <p className="mt-3 text-gray-600 text-base sm:text-lg">Tìm bác sĩ phù hợp theo chuyên khoa và đặt lịch khám nhanh chóng.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
             
            </div>
          </div>
        </div>
      </section>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8"></div>

          <div className="max-w-2xl mx-auto mb-6">
            <Input
              placeholder="Lọc theo chuyên khoa (vd: Tim mạch)"
              value={specialtyName}
              onChange={(e) => setSpecialtyName(e.target.value)}
            />
          </div>

          <div className="text-sm text-gray-600 text-center mb-6">
            {loading ? 'Đang tải...' : `Hiển thị ${data.length} bác sĩ`}
          </div>

          <div className="space-y-4">
            {currentDoctors.map((d) => (
              <Card key={d.id} className="border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-18 w-18 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      <Image unoptimized src={d.avatar || '/logos/LogoRevita-v2-noneBG.png'} alt={d.name} width={60} height={60} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{d.name}</h3>
                        <Badge variant="secondary" className="text-xs">{d.doctor.specialty?.name}</Badge>
                        {d.doctor.yearsExperience !== undefined && (
                          <span className="text-xs text-gray-500">{d.doctor.yearsExperience}+ năm kinh nghiệm</span>
                        )}
                        {typeof d.doctor.rating === 'number' && (
                          <span className="text-xs text-yellow-600">★ {d.doctor.rating.toFixed(1)}</span>
                        )}
                      </div>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Mã bác sĩ</p>
                          <p className="text-sm font-medium text-gray-800">{d.doctor.doctorCode}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Chuyên khoa</p>
                          <p className="text-sm font-medium text-gray-800">{d.doctor.specialty?.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Mã chuyên khoa</p>
                          <p className="text-sm font-medium text-gray-800">{d.doctor.specialty?.specialtyCode}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {d.doctor.workHistory && (
                          <p className="text-sm text-gray-700"><span className="font-medium">Kinh nghiệm: </span>{d.doctor.workHistory}</p>
                        )}
                        {d.doctor.description && (
                          <p className="text-sm text-gray-700">{d.doctor.description}</p>
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
            <div className="mt-8 flex items-center justify-center gap-2">
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


