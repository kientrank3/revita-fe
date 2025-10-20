'use client';

import { usePatientProfiles } from '@/lib/hooks/usePatientProfiles';
import { PatientProfileCard } from '@/components/patient/PatientProfileCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function MyPatientProfilesPage() {
  const { patientProfiles, loading, error, refetch } = usePatientProfiles();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={refetch}
              >
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hồ sơ bệnh nhân
              </h1>
              <p className="text-gray-600">
                Quản lý và xem thông tin các hồ sơ bệnh nhân của bạn
              </p>
            </div>
            <Button asChild>
              <Link href="/patient-profiles/create">
                <Plus className="h-4 w-4 mr-2" />
                Tạo hồ sơ mới
              </Link>
            </Button>
          </div>
        </div>

        {/* Content */}
        {!patientProfiles || patientProfiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có hồ sơ bệnh nhân
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Bạn chưa có hồ sơ bệnh nhân nào. Tạo hồ sơ đầu tiên để bắt đầu sử dụng dịch vụ y tế.
              </p>
              <Button asChild size="lg">
                <Link href="/patient-profiles/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo hồ sơ đầu tiên
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6">
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-gray-700">
                      Tổng số hồ sơ: <span className="font-semibold">{patientProfiles.length}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {patientProfiles.map((profile) => (
                <PatientProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
