'use client';

import { useParams } from 'next/navigation';
import { useMedicalRecords } from '@/lib/hooks/useMedicalRecords';
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
  Stethoscope,
  Download,
  Eye
} from 'lucide-react';
import Link from 'next/link';

export default function PatientProfileMedicalRecordsPage() {
  const params = useParams();
  const patientProfileId = params.id as string;
  
  const { patientProfiles } = usePatientProfiles();
  const { medicalRecords, isLoading, error, refresh } = useMedicalRecords({ 
    patientProfileId
  });
  
  // Ensure medicalRecords is always an array
  const safeMedicalRecords = Array.isArray(medicalRecords) ? medicalRecords : [];
  
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
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Hoàn thành</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="secondary">Đang xử lý</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Chờ xử lý</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
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
                onClick={refresh}
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
              Bệnh án - {currentProfile?.name || 'Hồ sơ bệnh nhân'}
            </h1>
            <p className="text-gray-600">
              Lịch sử khám bệnh và điều trị của hồ sơ này
            </p>
          </div>
        </div>

        {/* Patient Profile Info */}
        {currentProfile && <PatientProfileInfo profile={currentProfile} />}

        {/* Content */}
        {safeMedicalRecords.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Stethoscope className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có bệnh án
              </h3>
              <p className="text-gray-600 text-center">
                Hồ sơ này chưa có bệnh án nào. Bệnh án sẽ xuất hiện sau khi khám bệnh.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {safeMedicalRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Bệnh án #{record.id.slice(-8)}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>BS. {(record.doctor as unknown as { doctorCode?: string; description?: string })?.doctorCode || 'Chưa xác định'} - {(record.doctor as unknown as { doctorCode?: string; description?: string })?.description || ''}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(record.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Diagnosis */}
                  {record.diagnosis && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-1">Chẩn đoán:</h4>
                      <p className="text-red-800">{record.diagnosis}</p>
                    </div>
                  )}

                  {/* Symptoms */}
                  {record.symptoms && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-1">Triệu chứng:</h4>
                      <p className="text-yellow-800">{record.symptoms}</p>
                    </div>
                  )}

                  {/* Treatment */}
                  {record.treatment && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-1">Điều trị:</h4>
                      <p className="text-green-800">{record.treatment}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {record.notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Ghi chú:</h4>
                      <p className="text-blue-800">{record.notes}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {record.attachments && record.attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Tệp đính kèm:</h4>
                      <div className="space-y-2">
                        {record.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{(attachment as unknown as { name: string }).name}</span>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Tải xuống
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prescriptions Link */}
                  {Array.isArray(record.prescriptions) && record.prescriptions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Đơn thuốc:</h4>
                      <div className="space-y-2">
                        {record.prescriptions.map((prescription: { code: string; status: string }, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">
                                Đơn thuốc #{prescription.code}
                              </span>
                            </div>
                            <Badge variant="outline">{prescription.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/medical-records/${record.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </Link>
                    </Button>
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
