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
  Stethoscope,
  ClipboardList,
  Brain
} from 'lucide-react';
import { MedicalRecord, Template, MedicalRecordStatus, CreateMedicalRecordDto } from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { toast } from 'sonner';
import { DynamicMedicalRecordForm } from '@/components/medical-records/DynamicMedicalRecordForm';
import api from '@/lib/config';

export default function EditMedicalRecordPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;

  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<MedicalRecordStatus>(MedicalRecordStatus.DRAFT);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictions, setPredictions] = useState<Array<{ icd_code: string; probability: number; disease_name_en: string; disease_name_vi: string }>>([]);

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
  const handleSave = async (data: Record<string, any> | CreateMedicalRecordDto) => {
    if (!medicalRecord) return;

    try {
      setIsSaving(true);
      
      let updateData;
      if ('content' in data) {
        // This is a CreateMedicalRecordDto from create form
        updateData = {
          content: data.content,
          status: data.status || selectedStatus,
        };
      } else {
        // This is just content from edit form
        updateData = {
          content: data,
          status: selectedStatus,
        };
      }
      
      const updatedRecord = await medicalRecordService.update(medicalRecord.id, updateData);

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

  const handlePredict = async () => {
    if (!recordId) return;
    try {
      setIsPredicting(true);
      // Use GET as requested
      const response = await api.get(`/medical-records/${recordId}/predict`);
      const payload = response?.data ?? {};
      const list = (payload?.data?.predictions ?? payload?.predictions) as Array<{ icd_code: string; probability: number; disease_name_en: string; disease_name_vi: string }>;
      if (Array.isArray(list)) {
        setPredictions(list);
        if (!list.length) toast.info('Không có gợi ý bệnh phù hợp');
      } else {
        setPredictions([]);
        toast.error('Dữ liệu dự đoán không hợp lệ');
      }
    } catch (error) {
      console.error('Error predicting diseases:', error);
      toast.error('Có lỗi xảy ra khi chuẩn đoán tự động');
    } finally {
      setIsPredicting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-8 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Đang tải bệnh án...</span>
        </div>
      </div>
    );
  }

  if (!medicalRecord || !template) {
    return (
      <div className="container mx-auto px-8 py-6">
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
    <div className="container mx-auto px-8 py-6 bg-white">
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
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa bệnh án</h1>
            <p className="text-sm text-gray-600">
              {template.name} • ID: {medicalRecord.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(medicalRecord.status)} text-xs`}>
              {getStatusText(medicalRecord.status)}
            </Badge>
            <Button
              onClick={handlePredict}
              variant="secondary"
              className="flex items-center gap-2 text-sm"
              disabled={isPredicting}
            >
              <Brain className="h-4 w-4" />
              {isPredicting ? 'Đang chuẩn đoán...' : 'Chuẩn đoán tự động'}
            </Button>
            <Button
              onClick={() => router.push(`/medical-records/${recordId}/prescription`)}
              className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700"
            >
              <ClipboardList className="h-4 w-4" />
              Tạo phiếu chỉ định
            </Button>
          </div>
        </div>
      </div>

      {predictions.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-purple-600" />
              Kết quả chuẩn đoán tự động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {predictions.map((p, idx) => (
                <li key={`${p.icd_code}-${idx}`} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{p.disease_name_vi}</p>
                    <p className="text-xs text-gray-500">ICD: {p.icd_code}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <span className="text-xs text-gray-600">Xác suất</span>
                    <div className="font-semibold">{(p.probability * 100).toFixed(1)}%</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Status & Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Status Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5 text-blue-500" />
                Trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Trạng thái bệnh án</Label>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as MedicalRecordStatus)}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MedicalRecordStatus.DRAFT}>Nháp</SelectItem>
                    <SelectItem value={MedicalRecordStatus.IN_PROGRESS}>Đang điều trị</SelectItem>
                    <SelectItem value={MedicalRecordStatus.COMPLETED}>Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Record Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-3 w-3 text-blue-500" />
                  </div>
                  <h4 className="font-medium text-blue-900 text-sm">Thông tin bệnh án</h4>
                </div>
                <div className="space-y-1 text-xs text-blue-800">
                  <p><span className="font-medium">Template:</span> {template.name}</p>
                  <p><span className="font-medium">Chuyên khoa:</span> {template.specialtyName}</p>
                  <p><span className="font-medium">ID:</span> {medicalRecord.id}</p>
                  <p><span className="font-medium">Ngày tạo:</span> {new Date(medicalRecord.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-3">
          {medicalRecord.content && Object.keys(medicalRecord.content).length > 0 ? (
            <DynamicMedicalRecordForm
              key={`${medicalRecord.id}-${JSON.stringify(medicalRecord.content)}`}
              template={template}
              patientProfileId={medicalRecord.patientProfileId}
              doctorId={medicalRecord.doctorId}
              appointmentId={medicalRecord.appointmentId}
              onSubmit={handleSave}
              onCancel={handleCancel}
              initialData={medicalRecord.content}
              isEditing={true}
              existingAttachments={medicalRecord.attachments || []}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không có dữ liệu
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Bệnh án này không có dữ liệu để chỉnh sửa
                  </p>
                  <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
