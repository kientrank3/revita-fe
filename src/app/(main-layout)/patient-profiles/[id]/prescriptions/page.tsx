'use client';

import { useParams } from 'next/navigation';
import { usePrescriptionsByProfile } from '@/lib/hooks/usePrescriptionsByProfile';
import { usePatientProfiles } from '@/lib/hooks/usePatientProfiles';
import { PatientProfileInfo } from '@/components/patient/PatientProfileInfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User, 
  AlertCircle,
  Pill,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

export default function PatientProfilePrescriptionsPage() {
  const params = useParams();
  const patientProfileId = params.id as string;
  
  const { patientProfiles } = usePatientProfiles();
  const { prescriptions, loading, error, refetch } = usePrescriptionsByProfile(patientProfileId);
  
  // Ensure prescriptions is always an array
  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
  
  const currentProfile = patientProfiles.find(p => p.id === patientProfileId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Đã ký</Badge>;
      case 'DRAFT':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Nháp</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
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
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/my-patient-profiles">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Link>
            </Button>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Đơn thuốc - {currentProfile?.name || 'Hồ sơ bệnh nhân'}
            </h1>
            <p className="text-gray-600">
              Danh sách các đơn thuốc đã được kê cho hồ sơ này
            </p>
          </div>
        </div>

        {/* Patient Profile Info */}
        {currentProfile && <PatientProfileInfo profile={currentProfile} />}

        {/* Content */}
        {safePrescriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Pill className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có đơn thuốc
              </h3>
              <p className="text-gray-600 text-center">
                Hồ sơ này chưa có đơn thuốc nào. Đơn thuốc sẽ xuất hiện sau khi bác sĩ kê thuốc.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {safePrescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Đơn thuốc #{prescription.code}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>BS. {prescription.doctor.doctorCode} - {prescription.doctor.description}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(prescription.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(prescription.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  {prescription.note && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Ghi chú:</strong> {prescription.note}
                      </p>
                    </div>
                  )}

                  {/* Prescription Items */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Danh sách thuốc:</h4>
                    <div className="space-y-2">
                      {prescription.items.map((item, index) => (
                        <div key={item.id || index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                            {item.ndc && (
                              <Badge variant="outline" className="text-xs">
                                NDC: {item.ndc}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                            {item.strength && (
                              <div>
                                <span className="font-medium">Nồng độ:</span> {item.strength}
                              </div>
                            )}
                            {item.dosageForm && (
                              <div>
                                <span className="font-medium">Dạng:</span> {item.dosageForm}
                              </div>
                            )}
                            {item.dose && item.doseUnit && (
                              <div>
                                <span className="font-medium">Liều:</span> {item.dose} {item.doseUnit}
                              </div>
                            )}
                            {item.frequency && (
                              <div>
                                <span className="font-medium">Tần suất:</span> {item.frequency}
                              </div>
                            )}
                            {item.durationDays && (
                              <div>
                                <span className="font-medium">Thời gian:</span> {item.durationDays} ngày
                              </div>
                            )}
                            {item.quantity && item.quantityUnit && (
                              <div>
                                <span className="font-medium">Số lượng:</span> {item.quantity} {item.quantityUnit}
                              </div>
                            )}
                            {item.route && (
                              <div>
                                <span className="font-medium">Đường dùng:</span> {item.route}
                              </div>
                            )}
                          </div>
                          
                          {item.instructions && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                              <span className="font-medium text-yellow-800">Hướng dẫn:</span>
                              <p className="text-yellow-700 mt-1">{item.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
