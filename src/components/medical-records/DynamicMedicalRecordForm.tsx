/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FieldDefinition, 
  Template, 
  CreateMedicalRecordDto, 
  MedicalRecordStatus,
  Attachment 
} from '@/lib/types/medical-record';
import { Stethoscope } from 'lucide-react';
import { formatDateForInput } from '@/lib/utils';

interface DynamicMedicalRecordFormProps {
  template: Template;
  patientProfileId: string;
  doctorId?: string;
  appointmentId?: string;
  onSubmit: (data: CreateMedicalRecordDto | Record<string, any>) => Promise<void>;
  onCancel: () => void;
  initialData?: Record<string, any>;
  isEditing?: boolean;
}

export function DynamicMedicalRecordForm({
  template,
  patientProfileId,
  doctorId,
  appointmentId,
  onSubmit,
  onCancel,
  initialData = {},
  isEditing = false,
}: DynamicMedicalRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('Component props - initialData:', initialData);

  // Use useMemo to create formData from initialData
  const initialFormData = useMemo(() => {
    console.log('Creating initialFormData from:', initialData);
    if (!initialData || Object.keys(initialData).length === 0) {
      return {};
    }
    
    // Format date fields to yyyy-mm-dd for HTML date inputs
    const formattedData = { ...initialData };
    const fieldDefs = Array.isArray(template?.fields?.fields) ? template.fields.fields : [];
    fieldDefs.forEach((field: { type: string; name: string | number; }) => {
      if (field.type === 'date' && formattedData[field.name]) {
        formattedData[field.name] = formatDateForInput(formattedData[field.name]);
      }
    });
    
    return formattedData;
  }, [initialData, template.fields]);

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    console.log('Initializing formData with:', initialFormData);
    return initialFormData;
  });

  console.log('Component state - formData:', formData);

  // Update formData when initialData changes (for editing mode)
  useEffect(() => {
    console.log('useEffect triggered - initialData:', initialData);
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('Updating formData with initialData:', initialData);
      setFormData(initialData);
    }
  }, [initialData]);

  // Reset form data when initialData changes
  const resetFormData = useCallback(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('Resetting formData with:', initialData);
      setFormData(initialData);
    }
  }, [initialData]);

  // Force update formData when initialData changes (alternative approach)
  useEffect(() => {
    if (isEditing && initialData && Object.keys(initialData).length > 0) {
      console.log('Force updating formData for editing mode:', initialData);
      setFormData(initialData);
    }
  }, [isEditing, initialData]);

  // Call resetFormData when initialData changes
  useEffect(() => {
    resetFormData();
  }, [resetFormData]);

  // Initialize formData when component mounts
  useEffect(() => {
    if (isEditing && initialData && Object.keys(initialData).length > 0) {
      console.log('Initializing formData on mount:', initialData);
      setFormData(initialData);
    }
  }, [initialData, isEditing]); // Empty dependency array - only run once on mount

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleObjectFieldChange = (fieldName: string, subField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [subField]: value,
      },
    }));
  };

  const handleArrayFieldChange = (fieldName: string, index: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName]?.map((item: any, i: number) => 
        i === index ? value : item
      ) || [],
    }));
  };

  const addArrayItem = (fieldName: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), {}],
    }));
  };

  const removeArrayItem = (fieldName: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName]?.filter((_: any, i: number) => i !== index) || [],
    }));
  };

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.name];
    const isRequired = field.required;
    
    console.log(`Rendering field ${field.name}:`, value, 'formData keys:', Object.keys(formData));

    switch (field.type) {
      case 'string':
        return (
          <div key={field.name} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {field.label}
                  {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                </Label>
              </div>
              <Input
                id={field.name}
                value={value !== undefined && value !== null ? value : ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={`Nhập ${field.label.toLowerCase()}`}
                required={isRequired}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={field.name} className="bg-gray-50 rounded-lg p-4 border border-gray-100 md:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {field.label}
                  {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                </Label>
              </div>
              <Textarea
                id={field.name}
                value={value !== undefined && value !== null ? value : ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={`Nhập ${field.label.toLowerCase()}`}
                rows={4}
                required={isRequired}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {field.label}
                  {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                </Label>
              </div>
              <Input
                id={field.name}
                type="number"
                value={value !== undefined && value !== null ? value : ''}
                onChange={(e) => handleInputChange(field.name, parseFloat(e.target.value) || 0)}
                placeholder={`Nhập ${field.label.toLowerCase()}`}
                required={isRequired}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div key={field.name} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center space-x-3">
              <Checkbox
                id={field.name}
                checked={value === true}
                onCheckedChange={(checked) => handleInputChange(field.name, checked)}
              />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {field.label}
                  {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                </Label>
              </div>
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {field.label}
                  {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                </Label>
              </div>
              <Input
                id={field.name}
                type="date"
                value={value !== undefined && value !== null ? value : ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                required={isRequired}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        );

      case 'object':
        if (field.name === 'vital_signs') {
          return (
            <div key={field.name} className="bg-gray-50 rounded-lg p-4 border border-gray-100 md:col-span-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {field.label}
                    {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {field.properties && Object.entries(field.properties).map(([key, prop]: [string, any]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`${field.name}_${key}`} className="text-xs font-medium">
                        {key === 'temp' ? 'Nhiệt độ (°C)' :
                         key === 'bp' ? 'Huyết áp' :
                         key === 'hr' ? 'Nhịp tim (lần/phút)' :
                         key === 'rr' ? 'Nhịp thở (lần/phút)' :
                         key === 'o2_sat' ? 'SpO2 (%)' :
                         key === 'pain_score' ? 'Điểm đau (0-10)' :
                         key === 'weight' ? 'Cân nặng (kg)' :
                         key === 'height' ? 'Chiều cao (cm)' : key}
                      </Label>
                      <Input
                        id={`${field.name}_${key}`}
                        type={prop.type === 'number' ? 'number' : 'text'}
                        value={value?.[key] !== undefined && value?.[key] !== null ? value[key] : ''}
                        onChange={(e) => handleObjectFieldChange(
                          field.name, 
                          key, 
                          prop.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                        )}
                        placeholder={prop.type === 'number' ? '0' : ''}
                        className="text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        return null;

      case 'array':
        if (field.name === 'attachments') {
          return (
            <div key={field.name} className="bg-gray-50 rounded-lg p-4 border border-gray-100 md:col-span-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {field.label}
                    {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                  </h4>
                </div>
                <div className="space-y-3">
                  {(value || []).map((attachment: Attachment, index: number) => (
                    <div key={index} className="grid grid-cols-3 gap-2 p-2 border rounded-lg bg-white">
                      <Input
                        placeholder="Tên file"
                        value={attachment.filename !== undefined && attachment.filename !== null ? attachment.filename : ''}
                        onChange={(e) => handleArrayFieldChange(field.name, index, {
                          ...attachment,
                          filename: e.target.value,
                        })}
                        className="text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Input
                        placeholder="Loại file"
                        value={attachment.filetype !== undefined && attachment.filetype !== null ? attachment.filetype : ''}
                        onChange={(e) => handleArrayFieldChange(field.name, index, {
                          ...attachment,
                          filetype: e.target.value,
                        })}
                        className="text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="URL"
                          value={attachment.url !== undefined && attachment.url !== null ? attachment.url : ''}
                          onChange={(e) => handleArrayFieldChange(field.name, index, {
                            ...attachment,
                            url: e.target.value,
                          })}
                          className="text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem(field.name, index)}
                          className="text-xs p-1 h-8 w-8"
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem(field.name)}
                    className="text-sm"
                  >
                    Thêm tệp đính kèm
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = template.fields.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !formData[field.name]);
    
    if (missingFields.length > 0) {
      toast.error(`Vui lòng điền đầy đủ các trường bắt buộc: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        // For editing, just pass the content
        await onSubmit(formData);
      } else {
        // For creating, pass the full CreateMedicalRecordDto
        const submitData: CreateMedicalRecordDto = {
          patientProfileId,
          templateId: template.templateCode,
          doctorId,
          appointmentId,
          status: MedicalRecordStatus.DRAFT,
          content: formData,
        };
        await onSubmit(submitData);
      }
      
      toast.success(isEditing ? 'Cập nhật bệnh án thành công' : 'Tạo bệnh án thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              {isEditing ? 'Chỉnh sửa' : 'Tạo'} bệnh án - {template.name}
            </span>
            <Badge variant="secondary" className="text-xs">{template.specialtyName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.fields.fields.map((field) => renderField(field))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="text-sm">
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting} className="text-sm">
          {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Tạo bệnh án')}
        </Button>
      </div>
    </form>
  );
}
