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
    doctorId: user?.id || '',
    appointmentId: '',
    status: MedicalRecordStatus.DRAFT,
    content: {},
  });
  const [attachments, setAttachments] = useState<File[]>([]);

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
      content: {}, // Reset content when template changes
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
    if (!formData.templateId || !formData.patientProfileId) {
      toast.error('Vui lòng chọn template và nhập ID bệnh nhân');
      return;
    }

    try {
      setIsCreating(true);
      await medicalRecordService.create(formData as CreateMedicalRecordDto);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Template Selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientProfileId">ID Bệnh nhân *</Label>
                <Input
                  id="patientProfileId"
                  value={formData.patientProfileId}
                  onChange={(e) => handleInputChange('patientProfileId', e.target.value)}
                  placeholder="Nhập ID bệnh nhân"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointmentId">ID Lịch hẹn</Label>
                <Input
                  id="appointmentId"
                  value={formData.appointmentId}
                  onChange={(e) => handleInputChange('appointmentId', e.target.value)}
                  placeholder="Nhập ID lịch hẹn (tùy chọn)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Nháp</SelectItem>
                    <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                    <SelectItem value="ARCHIVED">Đã lưu trữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

                    {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chọn template
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Đang tải templates...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select 
                    value={formData.templateId} 
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn template bệnh án" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium">{template.name}</span>
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{selectedTemplate.name}</h4>
                          <p className="text-sm text-gray-600">{selectedTemplate.specialtyName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {selectedTemplate.fields?.fields?.length || 0} trường
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Template
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTemplateSelect('')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
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
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedTemplate.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {Array.isArray(selectedTemplate.fields?.fields) ? (
                    <>
                      {/* Dynamic Fields */}
                      <div className="space-y-6">
                        {selectedTemplate.fields.fields.map((field) => (
                          <div key={field.name} className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <Label htmlFor={field.name} className="text-base font-semibold text-gray-900">
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
                                  className="min-h-[120px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                              )}
                              
                              {field.type === 'string' && (
                                <Input
                                  id={field.name}
                                  placeholder={`Nhập ${field.label.toLowerCase()}...`}
                                  value={formData.content?.[field.name] || ''}
                                  onChange={(e) => handleContentChange(field.name, e.target.value)}
                                  required={field.required}
                                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
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
                                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                              )}
                              
                              {field.type === 'date' && (
                                <Input
                                  id={field.name}
                                  type="date"
                                  value={formData.content?.[field.name] || ''}
                                  onChange={(e) => handleContentChange(field.name, e.target.value)}
                                  required={field.required}
                                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                              )}
                              
                              {field.type === 'boolean' && (
                                <Select
                                  value={formData.content?.[field.name]?.toString() || ''}
                                  onValueChange={(value) => handleContentChange(field.name, value === 'true')}
                                >
                                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <Label className="text-base font-semibold text-gray-900">
                              Tệp đính kèm
                            </Label>
                          </div>
                          
                          <div className="space-y-4">
                            {/* File Upload */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Paperclip className="h-6 w-6 text-blue-600" />
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
                                  <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                        <Paperclip className="h-4 w-4 text-gray-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500">
                                          {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveFile(index)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
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
                      <p className="text-gray-500">Template này không có fields để điền</p>
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
                    Chọn template
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Vui lòng chọn một template từ danh sách bên trái để bắt đầu tạo bệnh án
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>• Template sẽ định nghĩa các trường cần điền</p>
                    <p>• Mỗi template phù hợp với loại bệnh án khác nhau</p>
                    <p>• Bạn có thể chọn template khác bất cứ lúc nào</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-6 border-t bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Hủy
            </Button>
            <p className="text-sm text-gray-500">
              {selectedTemplate ? `${selectedTemplate.fields?.fields?.length || 0} trường cần điền` : 'Chưa chọn template'}
            </p>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedTemplate || isCreating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
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
