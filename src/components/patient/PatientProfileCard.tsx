'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Edit, 
  Save, 
  X,
  Plus,
  UserCheck
} from 'lucide-react';
import { usePatientProfile } from '@/lib/hooks/usePatientProfile';
import { CreatePatientProfileDto } from '@/lib/services/patient-profile.service';
import { toast } from 'sonner';
import { formatDateForInput, formatDateForDisplay } from '@/lib/utils';

interface PatientProfileCardProps {
  patientId?: string;
  patientProfileId?: string;
  showActions?: boolean;
}

export function PatientProfileCard({ 
  patientId, 
  patientProfileId, 
  showActions = true 
}: PatientProfileCardProps) {
  const { 
    patientProfile, 
    isLoading, 
    error,
    createPatientProfile,
    updatePatientProfile
  } = usePatientProfile({ patientId, patientProfileId });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreatePatientProfileDto>({
    patientId: patientId || '',
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    occupation: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    healthInsurance: '',
    relationship: '',
  });

  const handleEdit = () => {
    if (patientProfile) {
      setFormData({
        patientId: patientProfile.patientId,
        name: patientProfile.name,
        dateOfBirth: formatDateForInput(patientProfile.dateOfBirth),
        gender: patientProfile.gender,
        address: patientProfile.address,
        occupation: patientProfile.occupation,
        emergencyContact: patientProfile.emergencyContact || { name: '', phone: '', relationship: '' },
        healthInsurance: patientProfile.healthInsurance,
        relationship: patientProfile.relationship,
      });
    }
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setFormData({
      patientId: patientId || '',
      name: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      occupation: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
      healthInsurance: '',
      relationship: '',
    });
    setIsEditing(false);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleSave = async () => {
    console.log('handleSave');
    console.log('isCreating', isCreating);
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const shouldCreate = isCreating || (!isEditing && !patientProfile);
      if (shouldCreate) {
        if (!formData.patientId || String(formData.patientId).trim() === '') {
          toast.error('Thiếu patientId. Vui lòng chọn bệnh nhân trước khi tạo hồ sơ.');
          return;
        }
        await createPatientProfile(formData);
        toast.success('Tạo hồ sơ thành công');
        setIsCreating(false);
      } else if (isEditing || patientProfile?.id) {
        if (!patientProfile?.id) {
          toast.error('Không tìm thấy ID hồ sơ để cập nhật');
          return;
        }
        await updatePatientProfile(formData);
        toast.success('Cập nhật hồ sơ thành công');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving patient profile:', error);
      toast.error('Lưu hồ sơ thất bại. Vui lòng kiểm tra dữ liệu và thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải thông tin bệnh nhân...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !patientProfile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          {showActions && (
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tạo hồ sơ bệnh nhân
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isCreating || isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isCreating ? 'Tạo hồ sơ bệnh nhân' : 'Chỉnh sửa hồ sơ bệnh nhân'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên *</Label>
              <Input
                id="name"
                value={formData.name ?? ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nhập họ và tên"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Ngày sinh *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth ?? ''}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính *</Label>
              <Select value={formData.gender ?? ''} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nam">Nam</SelectItem>
                  <SelectItem value="Nữ">Nữ</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="occupation">Nghề nghiệp</Label>
              <Input
                id="occupation"
                value={formData.occupation ?? ''}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Nhập nghề nghiệp"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ *</Label>
            <Input
              id="address"
              value={formData.address ?? ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Nhập địa chỉ đầy đủ"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="healthInsurance">Số bảo hiểm y tế</Label>
            <Input
              id="healthInsurance"
              value={formData.healthInsurance ?? ''}
              onChange={(e) => handleInputChange('healthInsurance', e.target.value)}
              placeholder="Nhập số BHYT"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="relationship">Quan hệ với chủ thẻ</Label>
            <Select value={formData.relationship ?? ''} onValueChange={(value) => handleInputChange('relationship', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn quan hệ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chính chủ">Chính chủ</SelectItem>
                <SelectItem value="Vợ/Chồng">Vợ/Chồng</SelectItem>
                <SelectItem value="Con">Con</SelectItem>
                <SelectItem value="Cha/Mẹ">Cha/Mẹ</SelectItem>
                <SelectItem value="Khác">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-3">Thông tin liên hệ khẩn cấp</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Họ và tên *</Label>
                <Input
                  id="emergencyName"
                  value={formData.emergencyContact?.name || ''}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                  placeholder="Họ và tên người liên hệ"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Số điện thoại *</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyContact?.phone || ''}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                  placeholder="Số điện thoại"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Quan hệ *</Label>
                <Input
                  id="emergencyRelationship"
                  value={formData.emergencyContact?.relationship || ''}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                  placeholder="Quan hệ"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Hủy
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Lưu
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!patientProfile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 mb-4">Chưa có hồ sơ bệnh nhân</p>
          {showActions && (
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tạo hồ sơ bệnh nhân
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Hồ sơ bệnh nhân
          </CardTitle>
          {showActions && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xl font-semibold">{patientProfile.name}</h3>
            <p className="text-gray-600 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(patientProfile.dateOfBirth)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">{patientProfile.gender}</Badge>
            {patientProfile.healthInsurance && (
              <Badge variant="secondary">BHYT: {patientProfile.healthInsurance}</Badge>
            )}
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700">{patientProfile.address}</span>
          </div>
          
          {patientProfile.occupation && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{patientProfile.occupation}</span>
            </div>
          )}
          
          {patientProfile.relationship && (
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Quan hệ: {patientProfile.relationship}</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div>
          <h4 className="font-semibold mb-2">Liên hệ khẩn cấp</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{patientProfile.emergencyContact?.name || '—'}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{patientProfile.emergencyContact?.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{patientProfile.emergencyContact?.relationship || '—'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
