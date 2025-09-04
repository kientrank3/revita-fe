'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Edit, 
  FileText,
} from 'lucide-react';
import { MedicalRecord, Template, MedicalRecordStatus, CreateMedicalRecordDto } from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service'; 
import { userService } from '@/lib/services/user.service';
import { patientProfileService } from '@/lib/services/patient-profile.service';
import { toast } from 'sonner';
import { MedicalRecordViewer } from '@/components/medical-records/MedicalRecordViewer';
import { DynamicMedicalRecordForm } from '@/components/medical-records/DynamicMedicalRecordForm';

interface DoctorData {
  id: string;
  name: string;
  email: string;
  phone: string;
  doctor?: {
    doctorCode: string;
    specialty: string;
  };
}

interface PatientProfileData {
  id: string;
  profileCode: string;
  name: string;
  patient?: {
    user?: {
      phone?: string;
    };
  };
}

export default function MedicalRecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;

  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Debug dialog state
  useEffect(() => {
    console.log('Dialog state changed:', isEditDialogOpen);
  }, [isEditDialogOpen]);

  // Load medical record and template
  useEffect(() => {
    const loadData = async () => {
      if (!recordId) return;

      try {
        setIsLoading(true);
        
        // Load medical record
        const record = await medicalRecordService.getById(recordId);
        setMedicalRecord(record);

        // Load template
        const templateData = await medicalRecordService.getTemplateByMedicalRecord(recordId);
        setTemplate(templateData);

        // Load patient profile
        try {
          const profileData = await patientProfileService.getById(record.patientProfileId);
          setPatientProfile(profileData);
        } catch (profileError) {
          console.error('Error loading patient profile:', profileError);
        }

        // Load doctor information if available
        if (record.doctorId) {
          try {
            const doctorData = await userService.getDoctorById(record.doctorId);
            setDoctor(doctorData as DoctorData);
          } catch (doctorError) {
            console.error('Error loading doctor:', doctorError);
          }
        }
      } catch (error) {
        console.error('Error loading medical record:', error);
        toast.error('Có lỗi xảy ra khi tải bệnh án');
        router.push('/medical-records');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [recordId, router]);

  const handleEdit = () => {
    console.log('Opening edit dialog...');
    console.log('Current state:', { medicalRecord, template, isEditDialogOpen });
    setIsEditDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (data: Record<string, any> | CreateMedicalRecordDto) => {
    if (!medicalRecord) return;

    try {
      setIsSaving(true);
      
      let updateData;
      if ('content' in data) {
        // This is a CreateMedicalRecordDto from create form
        updateData = {
          content: data.content,
          status: data.status || MedicalRecordStatus.COMPLETED,
        };
      } else {
        // This is just content from edit form
        updateData = {
          content: data,
          status: MedicalRecordStatus.COMPLETED, // Auto-complete when saving
        };
      }
      
      const updatedRecord = await medicalRecordService.update(medicalRecord.id, updateData);

      setMedicalRecord(updatedRecord);
      setIsEditDialogOpen(false);
      toast.success('Cập nhật bệnh án thành công');
    } catch (error) {
      console.error('Error updating medical record:', error);
      toast.error('Có lỗi xảy ra khi cập nhật bệnh án');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    console.log('Closing edit dialog...');
    setIsEditDialogOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!medicalRecord || !template) return;

    // Create a printable version of the medical record
    const printContent = `
      <html>
        <head>
          <title>Bệnh án - ${template.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: bold; margin-bottom: 5px; }
            .field-value { margin-left: 20px; }
            .metadata { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Bệnh án - ${template.name}</h1>
            <p>ID: ${medicalRecord.id}</p>
            <p>Ngày tạo: ${new Date(medicalRecord.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
          
          ${Object.entries(medicalRecord.content).map(([key, value]) => `
            <div class="field">
              <div class="field-label">${key}:</div>
              <div class="field-value">${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</div>
            </div>
          `).join('')}
          
          <div class="metadata">
            <p>Bệnh nhân ID: ${medicalRecord.patientProfileId}</p>
            <p>Bác sĩ ID: ${medicalRecord.doctorId || 'N/A'}</p>
            <p>Trạng thái: ${medicalRecord.status}</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benh-an-${medicalRecord.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    router.push('/medical-records');
  };

 


  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải bệnh án...</span>
        </div>
      </div>
    );
  }

  if (!medicalRecord || !template) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              Không tìm thấy bệnh án
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Bệnh án bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            </p>
            <Button onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto  bg-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div className="h-5 w-px bg-gray-300" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết bệnh án</h1>
            <p className="text-sm text-gray-600">
              {template.name} • {template.specialtyName}
              {patientProfile && (
                <span className="ml-2 text-blue-600">
                  • {patientProfile.name}
                </span>
              )}
              {doctor && (
                <span className="ml-2 text-green-600">
                  • Bác sĩ: {doctor.name}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Medical Record Content */}
      <MedicalRecordViewer
        medicalRecord={medicalRecord}
        template={template}
        patientProfile={patientProfile}
        doctor={doctor}
        onEdit={handleEdit}
        onPrint={handlePrint}
        onDownload={handleDownload}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Chỉnh sửa bệnh án
            </DialogTitle>
          </DialogHeader>
          
          {medicalRecord && template ? (
            <DynamicMedicalRecordForm
              template={template}
              patientProfileId={medicalRecord.patientProfileId}
              doctorId={medicalRecord.doctorId}
              appointmentId={medicalRecord.appointmentId}
              onSubmit={handleSave}
              onCancel={handleCancel}
              initialData={medicalRecord.content}
              isEditing={true}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Đang tải form...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
