'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Stethoscope, 
  Search,
  Plus,
  Shield
} from 'lucide-react';
import { MedicalRecordManager } from '@/components/medical-records/MedicalRecordManager';
import { PatientProfileCard } from '@/components/patient/PatientProfileCard';
import { PatientSearch } from '@/components/medical-records/PatientSearch';
import { useAuth } from '@/lib/hooks/useAuth';
import { PatientProfile, User as UserType } from '@/lib/types/user';
import Link from 'next/link';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { patientProfileService } from '@/lib/services/patient-profile.service';

export default function MedicalRecordsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);
  const [, setSelectedPatient] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState('medical-records');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  type GenderOption = 'MALE' | 'FEMALE' | 'OTHER';
  type PatientProfileForm = {
    name: string;
    dateOfBirth: string;
    gender: GenderOption | '';
    address: string;
    occupation: string;
    healthInsurance: string;
    relationship: string;
    emergencyContact: { name: string; phone: string; relationship: string };
  };
  const [editForm, setEditForm] = useState<PatientProfileForm>({
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    occupation: '',
    healthInsurance: '',
    relationship: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
  });
  const [createForm, setCreateForm] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    occupation: '',
    healthInsurance: '',
    relationship: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [searchResetKey, setSearchResetKey] = useState(0);

  const handlePatientProfileSelect = (patientProfile: PatientProfile | null) => {
    setSelectedPatientProfile(patientProfile);
    setActiveTab('patient-search');
    // Seed edit form when a profile is selected
    if (patientProfile) {
      setEditForm({
        name: patientProfile.name || '',
        dateOfBirth: patientProfile.dateOfBirth || '',
        gender: (patientProfile.gender as GenderOption) || '',
        address: patientProfile.address || '',
        occupation: patientProfile.occupation || '',
        healthInsurance: patientProfile.healthInsurance || '',
        relationship: patientProfile.relationship || '',
        emergencyContact: { name: '', phone: '', relationship: '' },
      });
    } else {
      setCurrentPatientId(null);
    }
  };
  const handlePatientSelect = (patient: UserType | null) => {
    setSelectedPatient(patient);
    setCurrentPatientId(patient?.id || null);
  };

  // Fetch patientId for selected profile to enable creating a new profile for same patient
  useEffect(() => {
    const run = async () => {
      if (!selectedPatientProfile) {
        setCurrentPatientId(null);
        return;
      }
      try {
        const full = await patientProfileService.getByProfileId(selectedPatientProfile.id);
        setCurrentPatientId(selectedPatientProfile.id || null);
        // Seed emergency contact if available
        if (full?.emergencyContact) {
          setEditForm((prev) => ({
            ...prev,
            emergencyContact: {
              name: full.emergencyContact?.name || '',
              phone: full.emergencyContact?.phone || '',
              relationship: full.emergencyContact?.relationship || '',
            }
          }));
        }
      } catch {
        setCurrentPatientId(null);
      }
    };
    void run();
  }, [selectedPatientProfile]);

  // Kiểm tra quyền bác sĩ
  const isDoctor = user?.role === 'DOCTOR' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Yêu cầu đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Vui lòng đăng nhập để truy cập hệ thống quản lý bệnh án.
            </p>
            <Button asChild>
              <a href="/login">Đăng nhập</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isDoctor) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Không có quyền truy cập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Chỉ bác sĩ mới có quyền truy cập hệ thống quản lý bệnh án.
            </p>
            <p className="text-sm text-gray-500">
              Vai trò hiện tại: {user?.role || 'Không xác định'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quản lý bệnh án
            </h1>
            <p className="text-gray-600">
              Chào mừng, Bác sĩ {user?.name || user?.email}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {user?.role}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3" />
              Bác sĩ
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="medical-records" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Bệnh án của tôi
          </TabsTrigger>
          <TabsTrigger value="patient-search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Tìm kiếm bệnh nhân
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medical-records" className="space-y-6">
                      <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bệnh án của bác sĩ</h2>
                <p className="text-gray-600">Tất cả bệnh án bạn đã tạo</p>
              </div>
              <Link href="/medical-records/create">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo bệnh án mới
                </Button>
              </Link>
            </div>
            
            <MedicalRecordManager 
              doctorId={user?.id}
            />
        </TabsContent>

        <TabsContent value="patient-search" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"></div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => {
                if (!currentPatientId) {
                  toast.error('Vui lòng chọn bệnh nhân hoặc hồ sơ để tạo hồ sơ mới');
                  return;
                }
                setCreateForm({
                  name: '', dateOfBirth: '', gender: '', address: '', occupation: '', healthInsurance: '', relationship: '',
                  emergencyContact: { name: '', phone: '', relationship: '' },
                });
                setIsCreateProfileOpen(true);
              }}>Tạo hồ sơ mới</Button>
              <Button variant="outline" size="sm" onClick={() => {
                setSelectedPatientProfile(null);
                setCurrentPatientId(null);
                setSearchResetKey((k) => k + 1);
              }}>Xoá trắng</Button>
            </div>
          </div>

          {/* Patient Search */}
          <PatientSearch 
            key={searchResetKey}
            onPatientProfileSelect={handlePatientProfileSelect} 
            selectedPatientProfile={selectedPatientProfile}
            onPatientSelect={handlePatientSelect}
          />

          {selectedPatientProfile && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Thông tin bệnh nhân</h2>
                  <p className="text-gray-600">{selectedPatientProfile.name} • {selectedPatientProfile.profileCode}</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Bệnh nhân
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2" />
                <div className="flex items-center gap-2">
                  
                  <Button variant="outline" size="sm" onClick={() =>{ setIsEditProfileOpen(true)}}>
                    Chỉnh sửa hồ sơ
                  </Button>
                </div>
              </div>

              <PatientProfileCard 
                patientProfileId={selectedPatientProfile.id}
                showActions={false}
              />

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Bệnh án của bệnh nhân</h2>
                  <p className="text-gray-600">{selectedPatientProfile.name}</p>
                </div>
                <Link href={`/medical-records/create?patientId=${selectedPatientProfile.id}`}>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tạo bệnh án cho bệnh nhân này
                  </Button>
                </Link>
              </div>
              
              <MedicalRecordManager 
                patientProfileId={selectedPatientProfile.id}
                doctorId={user?.id}
              />
            </div>
          )}

          {!selectedPatientProfile && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Tìm kiếm bệnh nhân
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sử dụng công cụ tìm kiếm ở trên để tìm và chọn bệnh nhân
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>• Tìm kiếm theo tên, số điện thoại hoặc email</p>
                    <p>• Xem thông tin cá nhân bệnh nhân</p>
                    <p>• Tạo và quản lý hồ sơ bệnh án</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hồ sơ bệnh nhân</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Họ và tên</Label>
                <Input value={editForm.name} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Ngày sinh</Label>
                <Input type="date" value={editForm.dateOfBirth} onChange={(e)=>setEditForm({...editForm, dateOfBirth: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Giới tính</Label>
                <Select value={editForm.gender} onValueChange={(v)=>setEditForm({...editForm, gender: v as GenderOption})}>
                  <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Nghề nghiệp</Label>
                <Input value={editForm.occupation} onChange={(e)=>setEditForm({...editForm, occupation: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Địa chỉ</Label>
              <Input value={editForm.address} onChange={(e)=>setEditForm({...editForm, address: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>LH khẩn cấp - Họ tên</Label>
                <Input value={editForm.emergencyContact.name} onChange={(e)=>setEditForm({...editForm, emergencyContact: {...editForm.emergencyContact, name: e.target.value}})} />
              </div>
              <div className="space-y-1">
                <Label>LH khẩn cấp - SĐT</Label>
                <Input value={editForm.emergencyContact.phone} onChange={(e)=>setEditForm({...editForm, emergencyContact: {...editForm.emergencyContact, phone: e.target.value}})} />
              </div>
              <div className="space-y-1">
                <Label>LHKC - Quan hệ</Label>
                <Input value={editForm.emergencyContact.relationship} onChange={(e)=>setEditForm({...editForm, emergencyContact: {...editForm.emergencyContact, relationship: e.target.value}})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Số BHYT</Label>
                <Input value={editForm.healthInsurance} onChange={(e)=>setEditForm({...editForm, healthInsurance: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Quan hệ với chủ thẻ</Label>
                <Select value={editForm.relationship} onValueChange={(v)=>setEditForm({...editForm, relationship: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn quan hệ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chính chủ">Chính chủ</SelectItem>
                    <SelectItem value="Vợ/Chồng">Vợ/Chồng</SelectItem>
                    <SelectItem value="Con">Con</SelectItem>
                    <SelectItem value="Cha/Mẹ">Cha/Mẹ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsEditProfileOpen(false)}>Đóng</Button>
            <Button
              onClick={async()=>{
                if (!selectedPatientProfile) return;
                if (isSubmittingEdit) return;
                try {
                  setIsSubmittingEdit(true);
                  await patientProfileService.update(selectedPatientProfile.id, editForm);
                  toast.success('Cập nhật hồ sơ thành công');
                  setIsEditProfileOpen(false);
                } catch {
                  toast.error('Không thể cập nhật hồ sơ');
                } finally {
                  setIsSubmittingEdit(false);
                }
              }}
              disabled={isSubmittingEdit}
            >
              {isSubmittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Profile Dialog */}
      <Dialog open={isCreateProfileOpen} onOpenChange={setIsCreateProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo hồ sơ bệnh nhân</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Họ và tên</Label>
                <Input value={createForm.name} onChange={(e)=>setCreateForm({...createForm, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Ngày sinh</Label>
                <Input type="date" value={createForm.dateOfBirth} onChange={(e)=>setCreateForm({...createForm, dateOfBirth: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Giới tính</Label>
                <Select value={createForm.gender} onValueChange={(v)=>setCreateForm({...createForm, gender: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Nghề nghiệp</Label>
                <Input value={createForm.occupation} onChange={(e)=>setCreateForm({...createForm, occupation: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Địa chỉ</Label>
              <Input value={createForm.address} onChange={(e)=>setCreateForm({...createForm, address: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>LH khẩn cấp - Họ tên</Label>
                <Input value={createForm.emergencyContact.name} onChange={(e)=>setCreateForm({...createForm, emergencyContact: {...createForm.emergencyContact, name: e.target.value}})} />
              </div>
              <div className="space-y-1">
                <Label>LH khẩn cấp - SĐT</Label>
                <Input value={createForm.emergencyContact.phone} onChange={(e)=>setCreateForm({...createForm, emergencyContact: {...createForm.emergencyContact, phone: e.target.value}})} />
              </div>
              <div className="space-y-1">
                <Label>LHKC - Quan hệ</Label>
                <Input value={createForm.emergencyContact.relationship} onChange={(e)=>setCreateForm({...createForm, emergencyContact: {...createForm.emergencyContact, relationship: e.target.value}})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Số BHYT</Label>
                <Input value={createForm.healthInsurance} onChange={(e)=>setCreateForm({...createForm, healthInsurance: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Quan hệ với chủ thẻ</Label>
                <Select value={createForm.relationship} onValueChange={(v)=>setCreateForm({...createForm, relationship: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn quan hệ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chính chủ">Chính chủ</SelectItem>
                    <SelectItem value="Vợ/Chồng">Vợ/Chồng</SelectItem>
                    <SelectItem value="Con">Con</SelectItem>
                    <SelectItem value="Cha/Mẹ">Cha/Mẹ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsCreateProfileOpen(false)}>Đóng</Button>
            <Button
              onClick={async()=>{
                if (!currentPatientId) return;
                if (isSubmittingCreate) return;
                try {
                  setIsSubmittingCreate(true);
                  await patientProfileService.create({
                    patientId: currentPatientId,
                    name: createForm.name,
                    dateOfBirth: createForm.dateOfBirth,
                    gender: createForm.gender,
                    address: createForm.address,
                    occupation: createForm.occupation,
                    emergencyContact: {
                      name: createForm.emergencyContact.name,
                      phone: createForm.emergencyContact.phone,
                      relationship: createForm.emergencyContact.relationship,
                    },
                    healthInsurance: createForm.healthInsurance,
                    relationship: createForm.relationship,
                  });
                  toast.success('Tạo hồ sơ thành công');
                  setIsCreateProfileOpen(false);
                } catch {
                  toast.error('Không thể tạo hồ sơ');
                } finally {
                  setIsSubmittingCreate(false);
                }
              }}
              disabled={isSubmittingCreate || !currentPatientId}
            >
              {isSubmittingCreate ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
