/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  MedicalRecord, 
  Template, 
  MedicalRecordStatus,
  Attachment 
} from '@/lib/types/medical-record';
import { userService } from '@/lib/services/user.service';
import { patientProfileService } from '@/lib/services/patient-profile.service';
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
  onEdit?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function MedicalRecordViewer({
  medicalRecord,
  template,
  onEdit,
  onPrint,
  onDownload,
}: MedicalRecordViewerProps) {
  const [doctor, setDoctor] = useState<any>(null);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Load doctor and patient information
  useEffect(() => {
    const loadAdditionalData = async () => {
      // Load patient profile
      try {
        setLoadingPatient(true);
        const profileData = await patientProfileService.getById(medicalRecord.patientProfileId);
        setPatientProfile(profileData);
      } catch (error) {
        console.error('Error loading patient profile:', error);
      } finally {
        setLoadingPatient(false);
      }

      // Load doctor information if available
      if (medicalRecord.doctorId) {
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
  }, [medicalRecord.doctorId, medicalRecord.patientProfileId]);
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
        return <p className="whitespace-pre-wrap">{value}</p>;

      case 'number':
        return <span className="font-medium">{value}</span>;

      case 'boolean':
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Có' : 'Không'}
          </Badge>
        );

      case 'date':
        return <span>{formatDate(value)}</span>;

      case 'object':
        if (field.name === 'vital_signs') {
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              {Object.entries(value).map(([key, val]: [string, any]) => (
                <div key={key} className="text-center">
                  <div className="text-sm text-gray-600 font-medium">
                    {key === 'temp' ? 'Nhiệt độ (°C)' :
                     key === 'bp' ? 'Huyết áp' :
                     key === 'hr' ? 'Nhịp tim (lần/phút)' :
                     key === 'rr' ? 'Nhịp thở (lần/phút)' :
                     key === 'o2_sat' ? 'SpO2 (%)' :
                     key === 'pain_score' ? 'Điểm đau (0-10)' :
                     key === 'weight' ? 'Cân nặng (kg)' :
                     key === 'height' ? 'Chiều cao (cm)' : key}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
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
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="flex-1">{attachment.filename}</span>
                  <Badge variant="outline">{attachment.filetype}</Badge>
                  <Button variant="ghost" size="sm" asChild>
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
      <div key={field.name} className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900">{field.label}</h4>
          {field.required && (
            <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>
          )}
        </div>
        <div className="pl-4 border-l-2 border-blue-200">
          {renderFieldValue(field, value)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Bệnh án - {template.name}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Tạo lúc: {formatDate(medicalRecord.createdAt)}</span>
                </div>
                {medicalRecord.updatedAt !== medicalRecord.createdAt && (
                  <div className="flex items-center gap-1">
                    <Edit className="h-4 w-4" />
                    <span>Cập nhật: {formatDate(medicalRecord.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(medicalRecord.status)}>
                {getStatusText(medicalRecord.status)}
              </Badge>
              <div className="flex gap-2">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-1" />
                    Chỉnh sửa
                  </Button>
                )}
                {onPrint && (
                  <Button variant="outline" size="sm" onClick={onPrint}>
                    <Printer className="h-4 w-4 mr-1" />
                    In
                  </Button>
                )}
                {onDownload && (
                  <Button variant="outline" size="sm" onClick={onDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Tải xuống
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Thông tin bệnh án
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {template.fields.fields.map((field, index) => (
            <div key={field.name}>
              {renderField(field)}
              {index < template.fields.fields.length - 1 && (
                <Separator className="my-6" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-600">Thông tin hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">ID bệnh án</div>
              <div className="text-gray-600 font-mono">{medicalRecord.id}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Bệnh nhân</div>
              <div className="text-gray-600">
                {loadingPatient ? (
                  <span className="text-gray-400">Đang tải...</span>
                ) : patientProfile ? (
                  <div>
                    <div className="font-medium">{patientProfile.name}</div>
                    <div className="text-sm text-gray-500">
                      {patientProfile.profileCode} • {patientProfile.patient?.user?.phone || 'N/A'}
                    </div>
                  </div>
                ) : (
                  <span className="font-mono text-sm">{medicalRecord.patientProfileId}</span>
                )}
              </div>
            </div>
            {medicalRecord.doctorId && (
              <div>
                <div className="font-medium text-gray-700">Bác sĩ</div>
                <div className="text-gray-600">
                  {loadingDoctor ? (
                    <span className="text-gray-400">Đang tải...</span>
                  ) : doctor ? (
                    <div>
                      <div className="font-medium">{doctor.name}</div>
                      <div className="text-sm text-gray-500">
                        {doctor.doctor?.doctorCode || 'N/A'} • {doctor.doctor?.specialty || 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <span className="font-mono text-sm">{medicalRecord.doctorId}</span>
                  )}
                </div>
              </div>
            )}
            {medicalRecord.appointmentId && (
              <div>
                <div className="font-medium text-gray-700">ID lịch hẹn</div>
                <div className="text-gray-600 font-mono">{medicalRecord.appointmentId}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
