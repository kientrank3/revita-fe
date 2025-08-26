'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Stethoscope, 
  Search,
  Plus,
  Shield
} from 'lucide-react';
import { MedicalRecordManager } from '@/components/medical-records/MedicalRecordManager';
import { PatientProfileCard } from '@/components/patient/PatientProfileCard';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

export default function MedicalRecordsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [activeTab, setActiveTab] = useState('medical-records');

  const handlePatientSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientId.trim()) {
      setActiveTab('patient-search');
    }
  };

  // Kiểm tra quyền bác sĩ
  const isDoctor = user?.role === 'DOCTOR' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Yêu cầu đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Vui lòng đăng nhập để truy cập hệ thống quản lý bệnh án.
            </p>
            <Button asChild>
              <a href="/login">Đăng nhập</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isDoctor) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Không có quyền truy cập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Chỉ bác sĩ mới có quyền truy cập hệ thống quản lý bệnh án.
            </p>
            <p className="text-sm text-gray-500">
              Vai trò hiện tại: {user?.role || 'Không xác định'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quản lý bệnh án
            </h1>
            <p className="text-gray-600">
              Chào mừng, Bác sĩ {user?.name || user?.email}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {user?.role}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3" />
              Bác sĩ
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="medical-records" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Bệnh án của tôi
          </TabsTrigger>
          <TabsTrigger value="patient-search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Tìm kiếm bệnh nhân
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medical-records" className="space-y-6">
                      <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bệnh án của bác sĩ</h2>
                <p className="text-gray-600">Tất cả bệnh án bạn đã tạo</p>
              </div>
              <Link href="/medical-records/create">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo bệnh án mới
                </Button>
              </Link>
            </div>
            
            <MedicalRecordManager 
              doctorId={user?.id}
            />
        </TabsContent>

        <TabsContent value="patient-search" className="space-y-6">
          {/* Patient Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Tìm kiếm bệnh nhân
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePatientSearch} className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="patientId">ID Bệnh nhân</Label>
                  <Input
                    id="patientId"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="Nhập ID bệnh nhân để tìm kiếm"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Tìm kiếm
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {patientId && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Thông tin bệnh nhân</h2>
                  <p className="text-gray-600">ID: {patientId}</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Bệnh nhân
                </Badge>
              </div>
              
              <PatientProfileCard 
                patientId={patientId}
                showActions={false}
              />

                              <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Bệnh án của bệnh nhân</h2>
                    <p className="text-gray-600">Bệnh nhân ID: {patientId}</p>
                  </div>
                  <Link href={`/medical-records/create?patientId=${patientId}`}>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Tạo bệnh án cho bệnh nhân này
                    </Button>
                  </Link>
                </div>
                
                <MedicalRecordManager 
                  patientProfileId={patientId}
                  doctorId={user?.id}
                />
            </div>
          )}

          {!patientId && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Tìm kiếm bệnh nhân
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Nhập ID bệnh nhân ở trên để xem thông tin và quản lý bệnh án
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>• Xem thông tin cá nhân bệnh nhân</p>
                    <p>• Tạo và quản lý hồ sơ bệnh án</p>
                    <p>• Theo dõi lịch sử khám bệnh</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
