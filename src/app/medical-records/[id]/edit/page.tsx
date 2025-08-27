'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  FileText,
  Stethoscope
} from 'lucide-react';
import { MedicalRecord, Template, MedicalRecordStatus } from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { toast } from 'sonner';
import { DynamicMedicalRecordForm } from '@/components/medical-records/DynamicMedicalRecordForm';

export default function EditMedicalRecordPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;

  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<MedicalRecordStatus>(MedicalRecordStatus.DRAFT);

  // Load medical record and template
  useEffect(() => {
    const loadData = async () => {
      if (!recordId) return;

      try {
        setIsLoading(true);
        
        // Load medical record
        const record = await medicalRecordService.getById(recordId);
        setMedicalRecord(record);
        setSelectedStatus(record.status);

        // Load template
        const templateData = await medicalRecordService.getTemplateByMedicalRecord(recordId);
        setTemplate(templateData);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (content: Record<string, any>) => {
    if (!medicalRecord) return;

    try {
      setIsSaving(true);
      
      const updatedRecord = await medicalRecordService.update(medicalRecord.id, {
        content,
        status: selectedStatus,
      });

      setMedicalRecord(updatedRecord);
      toast.success('Cập nhật bệnh án thành công');
      router.push(`/medical-records/${recordId}`);
    } catch (error) {
      console.error('Error updating medical record:', error);
      toast.error('Có lỗi xảy ra khi cập nhật bệnh án');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/medical-records/${recordId}`);
  };

  const handleBack = () => {
    router.push('/medical-records');
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
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa bệnh án</h1>
            <p className="text-gray-600">
              {template.name} • ID: {medicalRecord.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(medicalRecord.status)}>
              {getStatusText(medicalRecord.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Chỉnh sửa bệnh án - {template.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label className="mb-2 block">Trạng thái bệnh án</Label>
            <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as MedicalRecordStatus)}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MedicalRecordStatus.DRAFT}>Nháp</SelectItem>
                <SelectItem value={MedicalRecordStatus.COMPLETED}>Hoàn thành</SelectItem>
                <SelectItem value={MedicalRecordStatus.IN_PROGRESS}>Đang điều trị</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
        </CardContent>
      </Card>
    </div>
  );
}
