/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MedicalRecord, 
  Template, 
  MedicalRecordStatus,
  Attachment 
} from '@/lib/types/medical-record';
import { userService } from '@/lib/services/user.service';
import { 
  FileText, 
  Calendar, 
  User, 
  Stethoscope,
  Edit,
  Download,
  Printer
} from 'lucide-react';

interface MedicalRecordViewerProps {
  medicalRecord: MedicalRecord;
  template: Template;
  patientProfile?: any;
  doctor?: any;
  onEdit?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function MedicalRecordViewer({
  medicalRecord,
  template,
  patientProfile: propPatientProfile,
  doctor: propDoctor,
  onEdit,
  onPrint,
  onDownload,
}: MedicalRecordViewerProps) {
  const [doctor, setDoctor] = useState<any>(propDoctor);
  const [patientProfile, setPatientProfile] = useState<any>(propPatientProfile);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Load doctor and patient information if not provided
  useEffect(() => {
    const loadAdditionalData = async () => {
      // Load patient profile if not provided
      if (!propPatientProfile) {
        try {
          setLoadingPatient(true);
          const profileData = medicalRecord.patientProfile;
          console.log('profileData', profileData);
          setPatientProfile(profileData);
        } catch (error) {
          console.error('Error loading patient profile:', error);
        } finally {
          setLoadingPatient(false);
        }
      }

      // Load doctor information if not provided and available
      if (!propDoctor && medicalRecord.doctorId) {
        try {
          setLoadingDoctor(true);
          const doctorData = await userService.getDoctorById(medicalRecord.doctorId);
          setDoctor(doctorData);
        } catch (error) {
          console.error('Error loading doctor:', error);
        } finally {
          setLoadingDoctor(false);
        }
      }
    };

    loadAdditionalData();
  }, [medicalRecord.doctorId, medicalRecord.patientProfileId, propPatientProfile, propDoctor, medicalRecord.patientProfile]);

  // Update state when props change
  useEffect(() => {
    if (propPatientProfile) {
      setPatientProfile(propPatientProfile);
    }
    if (propDoctor) {
      setDoctor(propDoctor);
    }
  }, [propPatientProfile, propDoctor]);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: MedicalRecordStatus) => {
    switch (status) {
      case MedicalRecordStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case MedicalRecordStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800';
      case MedicalRecordStatus.IN_PROGRESS:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: MedicalRecordStatus) => {
    switch (status) {
      case MedicalRecordStatus.COMPLETED:
        return 'Hoàn thành';
      case MedicalRecordStatus.DRAFT:
        return 'Nháp';
      case MedicalRecordStatus.IN_PROGRESS:
        return 'Đang điều trị';
      default:
        return status;
    }
  };

  const renderFieldValue = (field: any, value: any) => {
    if (!value) return <span className="text-gray-500 italic">Chưa có dữ liệu</span>;

    switch (field.type) {
      case 'string':
      case 'text':
        return <p className="whitespace-pre-wrap text-sm leading-relaxed">{value}</p>;

      case 'number':
        return <span className="font-medium text-sm">{value}</span>;

      case 'boolean':
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Có' : 'Không'}
          </Badge>
        );

      case 'date':
        return <span className="text-sm">{formatDate(value)}</span>;

      case 'object':
        if (field.name === 'vital_signs') {
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-gray-200">
              {Object.entries(value).map(([key, val]: [string, any]) => (
                <div key={key} className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600 font-medium mb-1">
                    {key === 'temp' ? 'Nhiệt độ (°C)' :
                     key === 'bp' ? 'Huyết áp' :
                     key === 'hr' ? 'Nhịp tim (lần/phút)' :
                     key === 'rr' ? 'Nhịp thở (lần/phút)' :
                     key === 'o2_sat' ? 'SpO2 (%)' :
                     key === 'pain_score' ? 'Điểm đau (0-10)' :
                     key === 'weight' ? 'Cân nặng (kg)' :
                     key === 'height' ? 'Chiều cao (cm)' : key}
                  </div>
                  <div className="text-sm font-bold text-blue-600">
                    {val || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        return <pre className="text-sm">{JSON.stringify(value, null, 2)}</pre>;

      case 'array':
        if (field.name === 'attachments') {
          return (
            <div className="space-y-2">
              {value.map((attachment: Attachment, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded bg-white">
                  <FileText className="h-3 w-3 text-blue-500" />
                  <span className="flex-1 text-sm truncate">{attachment.filename}</span>
                  <Badge variant="outline" className="text-xs">{attachment.filetype}</Badge>
                  <Button variant="ghost" size="sm" asChild className="text-xs p-1 h-6">
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                      Xem
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          );
        }
        return (
          <div className="space-y-1">
            {value.map((item: any, index: number) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                {typeof item === 'object' ? JSON.stringify(item) : item}
              </div>
            ))}
          </div>
        );

      default:
        return <span>{String(value)}</span>;
    }
  };

  const renderField = (field: any) => {
    const value = medicalRecord.content[field.name];
    
    return (
      <div key={field.name} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              {field.label}
              {field.required && (
                <Badge variant="destructive" className="text-xs px-1 py-0.5 text-[10px]">Bắt buộc</Badge>
              )}
            </h4>
          </div>
          <div className="pl-4 border-l-2 border-blue-200">
            {renderFieldValue(field, value)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Column - Info & Actions */}
      <div className="lg:col-span-1 space-y-4">
        {/* Status & Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(medicalRecord.status)} text-sm`}>
                {getStatusText(medicalRecord.status)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>Tạo: {new Date(medicalRecord.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              {medicalRecord.updatedAt !== medicalRecord.createdAt && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Edit className="h-3 w-3" />
                  <span>Cập nhật: {new Date(medicalRecord.updatedAt).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} className="text-sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Chỉnh sửa
                </Button>
              )}
              {onPrint && (
                <Button variant="outline" size="sm" onClick={onPrint} className="text-sm">
                  <Printer className="h-4 w-4 mr-1" />
                  In
                </Button>
              )}
              {onDownload && (
                <Button variant="outline" size="sm" onClick={onDownload} className="text-sm">
                  <Download className="h-4 w-4 mr-1" />
                  Tải xuống
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Record Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-green-600" />
              Thông tin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-3 w-3 text-blue-600" />
                </div>
                <h4 className="font-medium text-blue-900 text-sm">Mẫu bệnh án</h4>
              </div>
              <div className="space-y-1 text-xs text-blue-800">
                <p><span className="font-medium">Tên:</span> {template.name}</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-green-600" />
                </div>
                <h4 className="font-medium text-green-900 text-sm">Bệnh nhân</h4>
              </div>
              <div className="space-y-1 text-xs text-green-800">
                {loadingPatient ? (
                  <p className="text-green-600">Đang tải...</p>
                ) : patientProfile ? (
                  <>
                    <p><span className="font-medium">Tên:</span> {patientProfile.name}</p>
                    <p><span className="font-medium">Mã:</span> {patientProfile.profileCode}</p>
                    <p><span className="font-medium">Địa chỉ:</span> {patientProfile.address}</p>
                    {patientProfile.patient?.user?.phone && (
                      <p><span className="font-medium">SĐT:</span> {patientProfile.patient.user.phone}</p>
                    )}
                  </>
                ) : (
                  <p className="text-green-600">Không tìm thấy thông tin</p>
                )}
              </div>
            </div>

            {medicalRecord.doctorId && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-purple-900 text-sm">Bác sĩ</h4>
                </div>
                <div className="space-y-1 text-xs text-purple-800">
                  {loadingDoctor ? (
                    <p className="text-purple-600">Đang tải...</p>
                  ) : doctor ? (
                    <>
                      <p><span className="font-medium">Tên:</span> {doctor.name}</p>
                      {doctor.doctor?.doctorCode && (
                        <p><span className="font-medium">Mã:</span> {doctor.doctor.doctorCode}</p>
                      )}
                      {doctor.doctor?.specialty && (
                        <p><span className="font-medium">Chuyên khoa:</span> {doctor.doctor.specialty}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-purple-600">Không tìm thấy thông tin</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Content */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-green-600" />
              Nội dung bệnh án
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {template.fields.fields.map((field) => renderField(field))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
