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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  // Presets and helper options for adapters
  const chiefComplaintOptions = useMemo(
    () => [
      'Đau đầu',
      'Sốt',
      'Ho',
      'Đau bụng',
      'Mệt mỏi',
      'Khó thở',
    ],
    []
  );

  const diagnosisOptions = useMemo(
    () => [
      'Cảm lạnh',
      'Viêm phổi',
      'Viêm họng',
      'Tăng huyết áp',
      'Đái tháo đường',
    ],
    []
  );

  const toothFDICodes = useMemo(() => {
    const codes: string[] = [];
    const addRange = (start: number, end: number) => {
      for (let i = start; i <= end; i++) codes.push(String(i));
    };
    addRange(11, 18);
    addRange(21, 28);
    addRange(31, 38);
    addRange(41, 48);
    return codes;
  }, []);

  const clinicalStages = ['I', 'II', 'III', 'IV'];
  const treatmentTypes = ['Phẫu thuật', 'Hoá trị', 'Xạ trị', 'Theo dõi'];
  const burnDepthOptions = ['I', 'II nông', 'II sâu', 'III'];
  const notificationStatusOptions = ['Đã khai báo', 'Chưa'];
  const deliveryPlans = ['Theo dõi', 'Mổ lấy thai', 'Sinh thường'];
  const muscleStrengthOptions = ['0/5', '1/5', '2/5', '3/5', '4/5', '5/5', 'MRC 0', 'MRC 1', 'MRC 2', 'MRC 3', 'MRC 4', 'MRC 5'];

  // Local UI adapters for special composed fields
  const [bpUi, setBpUi] = useState<{ sys: string; dia: string }>({ sys: '', dia: '' });
  const [vaUi, setVaUi] = useState<{ od: string; os: string }>({ od: '', os: '' });
  const [tnmUi, setTnmUi] = useState<{ t: string; n: string; m: string }>({ t: '', n: '', m: '' });
  const [tumorSizeNumber, setTumorSizeNumber] = useState<string>('');


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

  // Sync UI adapters from initial values
  useEffect(() => {
    const bpString: string | undefined = (formData?.vital_signs as any)?.bp;
    if (typeof bpString === 'string' && bpString.includes('/')) {
      const [s, d] = bpString.split('/');
      setBpUi({ sys: s?.trim() || '', dia: d?.trim() || '' });
    }

    const vaString = formData?.visual_acuity as string | undefined;
    if (typeof vaString === 'string') {
      // naive parse: OD x, OS y
      const odMatch = vaString.match(/OD\s*([^,]+)/i);
      const osMatch = vaString.match(/OS\s*([^,]+)/i);
      setVaUi({ od: odMatch?.[1]?.trim() || '', os: osMatch?.[1]?.trim() || '' });
    }

    const tnmString = formData?.tnm_classification as string | undefined;
    if (typeof tnmString === 'string') {
      const t = tnmString.match(/T\w+/)?.[0] || '';
      const n = tnmString.match(/N\w+/)?.[0] || '';
      const m = tnmString.match(/M\w+/)?.[0] || '';
      setTnmUi({ t, n, m });
    }

    const tumorSizeStr = formData?.tumor_size as string | undefined;
    if (typeof tumorSizeStr === 'string') {
      const num = tumorSizeStr.replace(/[^0-9.,]/g, '').replace(',', '.');
      setTumorSizeNumber(num);
    }
  }, [formData]);

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
    
    // console.log(`Rendering field ${field.name}:`, value, 'formData keys:', Object.keys(formData));

    switch (field.type) {
      case 'string':
        {
          // Select adapters for certain string fields
          if (field.name === 'diagnosis') {
            return (
              <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      {field.label}
                      {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                    </Label>
                  </div>
                  <Input
                    id={field.name}
                    list="diagnosis-list"
                    value={value !== undefined && value !== null ? value : ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder="Nhập hoặc chọn chẩn đoán"
                    required={isRequired}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-400 text-sm"
                  />
                  <datalist id="diagnosis-list">
                    {diagnosisOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
              </div>
            );
          }

          if (field.name === 'chief_complaint') {
            return (
              <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      {field.label}
                      {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                    </Label>
                  </div>
                  <Input
                    id={field.name}
                    list="cc-list"
                    value={value !== undefined && value !== null ? value : ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder="Nhập hoặc chọn triệu chứng chính"
                    required={isRequired}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-400 text-sm"
                  />
                  <datalist id="cc-list">
                    {chiefComplaintOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
              </div>
            );
          }

          if (field.name === 'tooth_number') {
            return (
              <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      {field.label}
                    </Label>
                  </div>
                  <Select
                    value={(value as string) || ''}
                    onValueChange={(v) => handleInputChange(field.name, v)}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Chọn mã răng (FDI)" />
                    </SelectTrigger>
                    <SelectContent>
                      {toothFDICodes.map((code) => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          }

          if (['clinical_stage', 'treatment_type', 'burn_depth', 'notification_status', 'delivery_plan', 'muscle_strength'].includes(field.name)) {
            const options = field.name === 'clinical_stage'
              ? clinicalStages
              : field.name === 'treatment_type'
              ? treatmentTypes
              : field.name === 'burn_depth'
              ? burnDepthOptions
              : field.name === 'notification_status'
              ? notificationStatusOptions
              : field.name === 'delivery_plan'
              ? deliveryPlans
              : muscleStrengthOptions;
            return (
              <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      {field.label}
                      {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                    </Label>
                  </div>
                  <Select value={(value as string) || ''} onValueChange={(v) => handleInputChange(field.name, v)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Chọn" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          }

          if (field.name === 'tnm_classification') {
            const tOptions = ['Tis', 'T0', 'T1', 'T2', 'T3', 'T4'];
            const nOptions = ['N0', 'N1', 'N2', 'N3'];
            const mOptions = ['M0', 'M1'];
            const onChange = (key: 't' | 'n' | 'm', v: string) => {
              const next = { ...tnmUi, [key]: v };
              setTnmUi(next);
              const composed = `${next.t}${next.n}${next.m}`.trim();
              handleInputChange(field.name, composed);
            };
            return (
              <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">{field.label}</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={tnmUi.t} onValueChange={(v) => onChange('t', v)}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="T" /></SelectTrigger>
                      <SelectContent>
                        {tOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Select value={tnmUi.n} onValueChange={(v) => onChange('n', v)}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="N" /></SelectTrigger>
                      <SelectContent>
                        {nOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Select value={tnmUi.m} onValueChange={(v) => onChange('m', v)}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="M" /></SelectTrigger>
                      <SelectContent>
                        {mOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          }

          if (field.name === 'tumor_size') {
            const onNumChange = (v: string) => {
              setTumorSizeNumber(v);
              const composed = v ? `${v} cm` : '';
              handleInputChange(field.name, composed);
            };
            return (
              <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">{field.label}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      value={tumorSizeNumber}
                      onChange={(e) => onNumChange(e.target.value)}
                      className="text-sm border-gray-300 focus:border-primary focus:ring-primary"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600">cm</span>
                  </div>
                </div>
              </div>
            );
          }

          if (field.name === 'visual_acuity') {
            const onChange = (key: 'od' | 'os', v: string) => {
              const next = { ...vaUi, [key]: v };
              setVaUi(next);
              const composed = [next.od ? `OD ${next.od}` : '', next.os ? `OS ${next.os}` : '']
                .filter(Boolean)
                .join(', ');
              handleInputChange(field.name, composed);
            };
            return (
              <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">{field.label}</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="OD" value={vaUi.od} onChange={(e) => onChange('od', e.target.value)} className="text-sm" />
                    <Input placeholder="OS" value={vaUi.os} onChange={(e) => onChange('os', e.target.value)} className="text-sm" />
                  </div>
                </div>
              </div>
            );
          }
        }
        return (
          <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
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
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-400 text-sm"
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
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
                className="border-gray-300 focus:border-primary focus:ring-primary text-sm"
              />
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {field.label}
                  {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                </Label>
              </div>
              <Input
                id={field.name}
                type="number"
                min={field.name === 'gestational_age' ? 0 : undefined}
                max={field.name === 'intraocular_pressure' ? 60 : field.name === 'burn_area_percent' ? 100 : undefined}
                step={field.name === 'temp' ? 0.1 : 1}
                value={value !== undefined && value !== null ? value : ''}
                onChange={(e) => handleInputChange(field.name, e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder={`Nhập ${field.label.toLowerCase()}`}
                required={isRequired}
                className="border-gray-300 focus:border-primary focus:ring-primary text-sm"
              />
            </div>
          </div>
        );

      case 'boolean':
        if (field.name === 'isolation_required' || field.name === 'itching') {
          return (
            <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {field.label}
                    {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                  </Label>
                </div>
                <Switch id={field.name} checked={value === true} onCheckedChange={(checked) => handleInputChange(field.name, !!checked)} />
              </div>
            </div>
          );
        }
        return (
          <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <Checkbox
                id={field.name}
                checked={value === true}
                onCheckedChange={(checked) => handleInputChange(field.name, checked)}
              />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
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
          <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
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
                className="border-gray-300 focus:border-primary focus:ring-primary text-sm"
              />
            </div>
          </div>
        );

      case 'object':
        if (field.name === 'vital_signs') {
          return (
            <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
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
                      {key === 'bp' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            id={`${field.name}_${key}_sys`}
                            type="number"
                            min={50}
                            max={300}
                            placeholder="SYS"
                            value={bpUi.sys}
                            onChange={(e) => {
                              const next = { sys: e.target.value, dia: bpUi.dia };
                              setBpUi(next);
                              const bpStr = next.sys && next.dia ? `${next.sys}/${next.dia}` : '';
                              handleObjectFieldChange(field.name, 'bp', bpStr);
                            }}
                            className="text-sm border-gray-300 focus:border-primary focus:ring-primary"
                          />
                          <span className="text-xs text-gray-600">/</span>
                          <Input
                            id={`${field.name}_${key}_dia`}
                            type="number"
                            min={30}
                            max={200}
                            placeholder="DIA"
                            value={bpUi.dia}
                            onChange={(e) => {
                              const next = { sys: bpUi.sys, dia: e.target.value };
                              setBpUi(next);
                              const bpStr = next.sys && next.dia ? `${next.sys}/${next.dia}` : '';
                              handleObjectFieldChange(field.name, 'bp', bpStr);
                            }}
                            className="text-sm border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                      ) : (
                        <Input
                          id={`${field.name}_${key}`}
                          type={prop.type === 'number' ? 'number' : 'text'}
                          min={key === 'temp' ? 30 : key === 'o2_sat' ? 0 : key === 'hr' || key === 'rr' ? 0 : key === 'pain_score' ? 0 : undefined}
                          max={key === 'temp' ? 43 : key === 'o2_sat' ? 100 : key === 'pain_score' ? 10 : undefined}
                          step={key === 'temp' ? 0.1 : 1}
                          value={value?.[key] !== undefined && value?.[key] !== null ? value[key] : ''}
                          onChange={(e) => handleObjectFieldChange(
                            field.name, 
                            key, 
                            prop.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value
                          )}
                          placeholder={prop.type === 'number' ? '0' : ''}
                          className="text-sm border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      )}
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
            <div key={field.name} className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {field.label}
                    {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                  </h4>
                </div>
                <div>
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      const mapped = files.map((f) => ({
                        filename: f.name,
                        filetype: f.type || 'unknown',
                        url: '',
                      }));
                      const next = [ ...(value || []), ...mapped ];
                      handleInputChange(field.name, next);
                    }}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Uploader demo: chỉ thêm metadata (filename/type). Hãy nhập URL nếu có.</p>
                </div>
                <div className="space-y-3">
                  {(value || []).map((attachment: Attachment, index: number) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 border rounded-lg bg-gray-50">
                      <Input
                        placeholder="Tên file"
                        value={attachment.filename !== undefined && attachment.filename !== null ? attachment.filename : ''}
                        onChange={(e) => handleArrayFieldChange(field.name, index, {
                          ...attachment,
                          filename: e.target.value,
                        })}
                        className="text-sm border-gray-300 focus:border-primary focus:ring-primary"
                      />
                      <Input
                        placeholder="Loại file"
                        value={attachment.filetype !== undefined && attachment.filetype !== null ? attachment.filetype : ''}
                        onChange={(e) => handleArrayFieldChange(field.name, index, {
                          ...attachment,
                          filetype: e.target.value,
                        })}
                        className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-400"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="URL"
                          value={attachment.url !== undefined && attachment.url !== null ? attachment.url : ''}
                          onChange={(e) => handleArrayFieldChange(field.name, index, {
                            ...attachment,
                            url: e.target.value,
                          })}
                          className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-400"
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

    const validationErrors: string[] = [];
    if (missingFields.length > 0) {
      validationErrors.push(`Thiếu: ${missingFields.map(f => f.label).join(', ')}`);
    }

    // Number range validations (non-exhaustive, based on known field names)
    const vs = (formData as any)?.vital_signs || {};
    const numericChecks: Array<{ label: string; value: any; min?: number; max?: number; }> = [
      { label: 'Nhiệt độ', value: vs.temp, min: 30, max: 43 },
      { label: 'SpO2', value: vs.o2_sat, min: 0, max: 100 },
      { label: 'Điểm đau', value: vs.pain_score, min: 0, max: 10 },
      { label: 'Nhịp tim', value: vs.hr, min: 0 },
      { label: 'Nhịp thở', value: vs.rr, min: 0 },
      { label: 'Phần trăm bỏng', value: (formData as any)?.burn_area_percent, min: 0, max: 100 },
      { label: 'IOP', value: (formData as any)?.intraocular_pressure, min: 0, max: 60 },
      { label: 'Tuổi thai (tuần)', value: (formData as any)?.gestational_age, min: 0 },
    ];
    numericChecks.forEach((c) => {
      if (c.value === '' || c.value === undefined || c.value === null) return;
      const num = typeof c.value === 'number' ? c.value : parseFloat(String(c.value));
      if (Number.isNaN(num)) return;
      if (c.min !== undefined && num < c.min) validationErrors.push(`${c.label} < ${c.min}`);
      if (c.max !== undefined && num > c.max) validationErrors.push(`${c.label} > ${c.max}`);
    });

    // Date validations: onset_date, burn_date should not be in the future
    const dateFieldNames = ['onset_date', 'burn_date', 'procedure_date'];
    const now = new Date();
    dateFieldNames.forEach((name) => {
      const v = (formData as any)[name];
      if (!v) return;
      const d = new Date(v);
      if (name !== 'procedure_date' && d.getTime() > now.getTime()) {
        validationErrors.push(`${name} không được ở tương lai`);
      }
    });

    if (validationErrors.length > 0) {
      toast.error(`Vui lòng kiểm tra: ${validationErrors.join('; ')}`);
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
          templateId: template.id,
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
              <Stethoscope className="h-5 w-5 text-blue-500" />
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

      <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t pt-4 pb-4 flex justify-end gap-3">
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
