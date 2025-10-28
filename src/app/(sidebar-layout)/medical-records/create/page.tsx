/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { 
  ArrowLeft, 
  FileText, 
  User, 
  Save,
  X,
  Pill,
} from 'lucide-react';
import { Template, CreateMedicalRecordDto, MedicalRecordStatus } from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { PatientSearch } from '@/components/medical-records/PatientSearch';
import { DynamicMedicalRecordForm } from '@/components/medical-records/DynamicMedicalRecordForm';
import { PatientProfile } from '@/lib/types/user';
import { CreatePrescriptionDialog } from '@/components/medication-prescriptions/CreatePrescriptionDialog';
import { medicationPrescriptionApi } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';

function CreateMedicalRecordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const patientProfileId = searchParams.get('patientId');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateMedicalRecordDto>>({
    patientProfileId: patientProfileId || '',
    templateId: '',
    doctorId: user?.id ,
    appointmentId: '',
    status: MedicalRecordStatus.DRAFT,
    content: {},
  });
  // const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);
  
  // Prescription creation states
  const [createPrescriptionAfter, setCreatePrescriptionAfter] = useState(false);
  const [showCreatePrescriptionDialog, setShowCreatePrescriptionDialog] = useState(false);
  const [createdMedicalRecordId, setCreatedMedicalRecordId] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const templatesData = await medicalRecordService.getTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Có lỗi xảy ra khi tải templates');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Update selected template when templateId changes
  useEffect(() => {
    if (formData.templateId) {
      const template = templates.find(t => t.id === formData.templateId);
      setSelectedTemplate(template || null);
    } else {
      setSelectedTemplate(null);
    }
  }, [formData.templateId, templates]);

  const handleTemplateSelect = (templateId: string) => {
    setFormData(prev => ({
      ...prev,
      templateId,
      doctorId: user?.id ,
      content: {}, // Reset content when template changes
    }));
  };

  const handlePatientProfileSelect = (patientProfile: PatientProfile | null) => {
    setSelectedPatientProfile(patientProfile);
    setFormData(prev => ({
      ...prev,
      patientProfileId: patientProfile ? patientProfile.id : '',
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Content is managed by DynamicMedicalRecordForm now

  // File upload is handled inside DynamicMedicalRecordForm

  // File removal is handled inside DynamicMedicalRecordForm

  const handleSubmit = async () => {
    if (!formData.templateId || !selectedPatientProfile) {
      toast.error('Vui lòng chọn template và bệnh nhân');
      return;
    }
    console.log('formData', formData);
    try {
      setIsCreating(true);

      const payload: any = { ...formData };
      if (!payload.appointmentId || String(payload.appointmentId).trim() === '') {
        delete payload.appointmentId;
      }
      const createdRecord = await medicalRecordService.create(payload as CreateMedicalRecordDto);
      toast.success('Tạo bệnh án thành công');
      
      // If user wants to create prescription after, store the medical record ID and show dialog
      if (createPrescriptionAfter && selectedPatientProfile) {
        setCreatedMedicalRecordId(createdRecord.id);
        setShowCreatePrescriptionDialog(true);
      } else {
        router.push('/medical-records');
      }
    } catch (error) {
      console.error('Error creating medical record:', error);
      toast.error('Có lỗi xảy ra khi tạo bệnh án');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    router.push('/medical-records');
  };

  const handleCreatePrescription = async (data: {
    patientProfileId: string;
    medicalRecordId?: string;
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    items: any[];
  }) => {
    try {
      await medicationPrescriptionApi.create(data);
      toast.success('Tạo đơn thuốc thành công');
      setShowCreatePrescriptionDialog(false);
      // Redirect to medical records after successful prescription creation
      router.push('/medical-records');
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Có lỗi xảy ra khi tạo đơn thuốc');
      throw error;
    }
  };

  return (
    <div className="container bg-white mx-auto px-8 py-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-3xl font-bold text-gray-900">Tạo bệnh án mới</h1>
        </div>
        <p className="text-gray-600">
          Chọn template và điền thông tin để tạo bệnh án mới
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Basic Info & Template Selection */}
        <div className="lg:col-span-1 space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bệnh nhân *</Label>
                <div className="relative">
                                  <PatientSearch 
                  onPatientProfileSelect={handlePatientProfileSelect}
                  selectedPatientProfile={selectedPatientProfile}
                  compact={true}
                />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointmentId" className="text-sm font-medium">ID Lịch hẹn</Label>
                <Input
                  id="appointmentId"
                  value={formData.appointmentId}
                  onChange={(e) => handleInputChange('appointmentId', e.target.value)}
                  placeholder="Nhập ID lịch hẹn (tùy chọn)"
                  className="text-sm"
                />
              </div>

              {/* Prescription Creation Option */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="createPrescription" 
                    checked={createPrescriptionAfter}
                    onCheckedChange={(checked) => setCreatePrescriptionAfter(checked as boolean)}
                  />
                  <Label 
                    htmlFor="createPrescription" 
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Pill className="h-4 w-4 text-blue-500" />
                    Tạo đơn thuốc
                  </Label>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Chọn template
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Đang tải mẫu bệnh án...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Select 
                    value={formData.templateId} 
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Chọn mẫu bệnh án" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{template.name}</span>
                              <span className="text-xs text-gray-500">{template.specialtyName}</span>
                            </div>
                            <Badge variant="outline" className="text-xs ml-2">
                              {template.fields?.fields?.length || 0}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedTemplate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{selectedTemplate.name}</h4>
                          <p className="text-xs text-gray-600">{selectedTemplate.specialtyName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {selectedTemplate.fields?.fields?.length || 0} trường
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTemplateSelect('')}
                          className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - DynamicMedicalRecordForm for Create */}
        <div className="lg:col-span-3">
          {selectedTemplate ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  {selectedTemplate.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicMedicalRecordForm
                  template={selectedTemplate}
                  patientProfileId={selectedPatientProfile?.id || formData.patientProfileId || ''}
                  doctorId={user?.id}
                  appointmentId={formData.appointmentId}
                  onSubmit={async (data) => {
                    try {
                      setIsCreating(true);
                      // If child returns only content (should not in create), normalize
                      const payload = (data as any).content
                        ? data
                        : {
                            patientProfileId: selectedPatientProfile?.id || formData.patientProfileId || '',
                            templateId: selectedTemplate.templateCode,
                            doctorId: user?.id,
                            appointmentId: formData.appointmentId || undefined,
                            status: 'DRAFT',
                            content: data,
                          };
                      const createdRecord = await medicalRecordService.create(payload as any);
                      toast.success('Tạo bệnh án thành công');
                      
                      // If user wants to create prescription after, store the medical record ID and show dialog
                      if (createPrescriptionAfter && selectedPatientProfile) {
                        setCreatedMedicalRecordId(createdRecord.id);
                        setShowCreatePrescriptionDialog(true);
                      } else {
                        router.push('/medical-records');
                      }
                    } catch (error) {
                      console.error('Error creating medical record:', error);
                      toast.error('Có lỗi xảy ra khi tạo bệnh án');
                      throw error;
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                  onCancel={() => router.push('/medical-records')}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Chọn mẫu bệnh án
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Vui lòng chọn một mẫu từ danh sách bên trái để bắt đầu tạo bệnh án
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>• Mẫu bệnh án sẽ định nghĩa các trường cần điền</p>
                    <p>• Mỗi mẫu bệnh án phù hợp với loại bệnh án khác nhau</p>
                    <p>• Bạn có thể chọn mẫu bệnh án khác bất cứ lúc nào</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2 text-sm">
              <X className="h-4 w-4" />
              Hủy
            </Button>
            <p className="text-xs text-gray-500">
              {selectedTemplate ? `${selectedTemplate.fields?.fields?.length || 0} trường cần điền` : 'Chưa chọn mẫu'}
              {selectedPatientProfile && ` • ${selectedPatientProfile.name}`}
              {createPrescriptionAfter && ` • Sẽ tạo đơn thuốc sau khi lưu`}
            </p>
          </div>
          {/* When using DynamicMedicalRecordForm, use its internal submit button to ensure content is sent */}
          {!selectedTemplate ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isCreating}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-sm"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Tạo bệnh án
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Create Prescription Dialog */}
      <CreatePrescriptionDialog
        open={showCreatePrescriptionDialog}
        onOpenChange={setShowCreatePrescriptionDialog}
        onSave={handleCreatePrescription}
        preselectedPatientProfile={selectedPatientProfile}
        preselectedMedicalRecordId={createdMedicalRecordId || undefined}
      />
    </div>
  );
}

export default function CreateMedicalRecordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></span>
            Đang tải...
          </div>
        </div>
      }
    >
      <CreateMedicalRecordPageContent />
    </Suspense>
  );
}
