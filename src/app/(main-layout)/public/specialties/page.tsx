'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { publicApi } from '@/lib/api';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

type PublicSpecialty = {
  id: string;
  specialtyCode: string;
  name: string;
};

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<PublicSpecialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await publicApi.getSpecialties();
        setSpecialties(res.data || []);
      } catch (e: unknown) {
        const maybe = e as { response?: { data?: { message?: string } }; message?: unknown };
        const message = typeof maybe.response?.data?.message === 'string' && maybe.response.data.message.length > 0
          ? maybe.response.data.message
          : typeof maybe.message === 'string' && maybe.message.length > 0
          ? maybe.message
          : 'Không thể tải danh sách chuyên khoa';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialties();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(specialties.length / itemsPerPage)), [specialties.length]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex]);
  const currentItems = useMemo(() => specialties.slice(startIndex, endIndex), [specialties, startIndex, endIndex]);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-blue-50 to-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Các khoa của bệnh viện</h1>
            <p className="mt-3 text-gray-600 text-base sm:text-lg">Khám phá chuyên khoa và dịch vụ phù hợp với nhu cầu của bạn.</p>
          </div>
        </div>
      </section>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8"></div>

          <div className="space-y-4">
            {currentItems.map((dept) => (
              <Card key={dept.id} className="border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-gray-900">{dept.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">{dept.specialtyCode}</Badge>
                      </div>
                      <Separator className="my-2" />
                      <p className="text-sm text-gray-600">Mã chuyên khoa: {dept.specialtyCode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {loading && (
            <div className="text-center text-sm text-gray-500 mt-6">Đang tải...</div>
          )}
          {!loading && !error && specialties.length === 0 && (
            <div className="text-center text-sm text-gray-500 mt-6">Không có chuyên khoa</div>
          )}
          {error && (
            <div className="text-center text-sm text-red-600 mt-6">{error}</div>
          )}

          {/* Pagination */}
          {!loading && specialties.length > 0 && (
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


