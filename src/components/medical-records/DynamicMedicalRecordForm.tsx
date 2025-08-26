/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
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

interface DynamicMedicalRecordFormProps {
  template: Template;
  patientProfileId: string;
  doctorId?: string;
  appointmentId?: string;
  onSubmit: (data: CreateMedicalRecordDto) => Promise<void>;
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
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    switch (field.type) {
      case 'string':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
            </Label>
            <Input
              id={field.name}
              value={value || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={`Nhập ${field.label.toLowerCase()}`}
              required={isRequired}
            />
          </div>
        );

      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
            </Label>
            <Textarea
              id={field.name}
              value={value || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={`Nhập ${field.label.toLowerCase()}`}
              rows={4}
              required={isRequired}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value || ''}
              onChange={(e) => handleInputChange(field.name, parseFloat(e.target.value) || 0)}
              placeholder={`Nhập ${field.label.toLowerCase()}`}
              required={isRequired}
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value || false}
              onCheckedChange={(checked) => handleInputChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
            </Label>
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-2">
              {field.label}
              {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={isRequired}
            />
          </div>
        );

      case 'object':
        if (field.name === 'vital_signs') {
          return (
            <Card key={field.name} className="space-y-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {field.label}
                  {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {field.properties && Object.entries(field.properties).map(([key, prop]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`${field.name}_${key}`}>
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
                      value={value?.[key] || ''}
                      onChange={(e) => handleObjectFieldChange(
                        field.name, 
                        key, 
                        prop.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                      )}
                      placeholder={prop.type === 'number' ? '0' : ''}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        }
        return null;

      case 'array':
        if (field.name === 'attachments') {
          return (
            <Card key={field.name} className="space-y-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {field.label}
                  {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(value || []).map((attachment: Attachment, index: number) => (
                  <div key={index} className="grid grid-cols-3 gap-2 p-3 border rounded-lg">
                    <Input
                      placeholder="Tên file"
                      value={attachment.filename || ''}
                      onChange={(e) => handleArrayFieldChange(field.name, index, {
                        ...attachment,
                        filename: e.target.value,
                      })}
                    />
                    <Input
                      placeholder="Loại file"
                      value={attachment.filetype || ''}
                      onChange={(e) => handleArrayFieldChange(field.name, index, {
                        ...attachment,
                        filetype: e.target.value,
                      })}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="URL"
                        value={attachment.url || ''}
                        onChange={(e) => handleArrayFieldChange(field.name, index, {
                          ...attachment,
                          url: e.target.value,
                        })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem(field.name, index)}
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
                >
                  Thêm tệp đính kèm
                </Button>
              </CardContent>
            </Card>
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
      const submitData: CreateMedicalRecordDto = {
        patientProfileId,
        templateId: template.templateCode,
        doctorId,
        appointmentId,
        status: MedicalRecordStatus.DRAFT,
        content: formData,
      };

      await onSubmit(submitData);
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
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Chỉnh sửa' : 'Tạo'} bệnh án - {template.name}</span>
            <Badge variant="secondary">{template.specialtyName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {template.fields.fields.map((field) => renderField(field))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Tạo bệnh án')}
        </Button>
      </div>
    </form>
  );
}
