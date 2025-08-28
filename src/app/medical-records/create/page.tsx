/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { 
  ArrowLeft, 
  FileText, 
  User, 
  Save,
  X,
  Paperclip,
  Trash2,
} from 'lucide-react';
import { Template, CreateMedicalRecordDto, MedicalRecordStatus } from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { PatientSearch } from '@/components/medical-records/PatientSearch';
import { PatientProfile } from '@/lib/types/user';

export default function CreateMedicalRecordPage() {
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);

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

  const handleContentChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value,
      },
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.templateId || !selectedPatientProfile) {
      toast.error('Vui lòng chọn template và bệnh nhân');
      return;
    }

    try {
      setIsCreating(true);

      const payload: any = { ...formData };
      if (!payload.appointmentId || String(payload.appointmentId).trim() === '') {
        delete payload.appointmentId;
      }
      console.log('formData', formData);
      await medicalRecordService.create(payload as CreateMedicalRecordDto);
      toast.success('Tạo bệnh án thành công');
      router.push('/medical-records');
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

  return (
    <div className="container mx-auto py-8">
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
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
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
                          <FileText className="h-4 w-4 text-blue-600" />
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

        {/* Right Column - Template Form */}
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
                <div className="space-y-6">
                  {Array.isArray(selectedTemplate.fields?.fields) ? (
                    <>
                      {/* Dynamic Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedTemplate.fields.fields.map((field) => (
                          <div key={field.name} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                              </div>
                              
                              {field.type === 'text' && (
                                <Textarea
                                  id={field.name}
                                  placeholder={`Nhập ${field.label.toLowerCase()}...`}
                                  value={formData.content?.[field.name] || ''}
                                  onChange={(e) => handleContentChange(field.name, e.target.value)}
                                  required={field.required}
                                  className="min-h-[100px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                              )}
                              
                              {field.type === 'string' && (
                                <Input
                                  id={field.name}
                                  placeholder={`Nhập ${field.label.toLowerCase()}...`}
                                  value={formData.content?.[field.name] || ''}
                                  onChange={(e) => handleContentChange(field.name, e.target.value)}
                                  required={field.required}
                                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                              )}
                              
                              {field.type === 'number' && (
                                <Input
                                  id={field.name}
                                  type="number"
                                  placeholder={`Nhập ${field.label.toLowerCase()}...`}
                                  value={formData.content?.[field.name] || ''}
                                  onChange={(e) => handleContentChange(field.name, parseFloat(e.target.value) || 0)}
                                  required={field.required}
                                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                              )}
                              
                              {field.type === 'date' && (
                                <Input
                                  id={field.name}
                                  type="date"
                                  value={formData.content?.[field.name] || ''}
                                  onChange={(e) => handleContentChange(field.name, e.target.value)}
                                  required={field.required}
                                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                              )}
                              
                              {field.type === 'boolean' && (
                                <Select
                                  value={formData.content?.[field.name]?.toString() || ''}
                                  onValueChange={(value) => handleContentChange(field.name, value === 'true')}
                                >
                                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
                                    <SelectValue placeholder="Chọn..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">Có</SelectItem>
                                    <SelectItem value="false">Không</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* File Attachments */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 md:col-span-2">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <Label className="text-sm font-semibold text-gray-900">
                              Tệp đính kèm
                            </Label>
                          </div>
                          
                          <div className="space-y-3">
                            {/* File Upload */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                              <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                              />
                              <label htmlFor="file-upload" className="cursor-pointer">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Paperclip className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      Tải lên tệp đính kèm
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      PDF, DOC, DOCX, JPG, PNG, XLS, XLSX (tối đa 10MB)
                                    </p>
                                  </div>
                                </div>
                              </label>
                            </div>

                            {/* File List */}
                            {attachments.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Tệp đã chọn:</p>
                                {attachments.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                                        <Paperclip className="h-3 w-3 text-gray-600" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">
                                          {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveFile(index)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Mẫu này không có trường để điền</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Cấu trúc fields: {selectedTemplate.fields ? 'Có' : 'Không có'} fields object
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-blue-600" />
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
            </p>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedTemplate || isCreating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-sm"
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
        </div>
      </div>
    </div>
  );
}
