'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientSearch } from '@/components/medical-records/PatientSearch';
import { PatientProfileCard } from '@/components/patient/PatientProfileCard';
import { toast } from 'sonner';
import { patientProfileService } from '@/lib/services/patient-profile.service';
import { useAuth } from '@/lib/hooks/useAuth';
import { PatientProfile, User as UserType } from '@/lib/types/user';
import { Search, Users, Plus, Shield } from 'lucide-react';

export default function ReceptionPatientProfilesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<UserType | null>(null);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [creating, setCreating] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    occupation: '',
  });

  useEffect(() => {
    if (selectedPatientProfile) {
      // Seed form with profile data for quick edits if needed later
      setCreateForm((prev) => ({
        ...prev,
        name: selectedPatientProfile.name || '',
        dateOfBirth: selectedPatientProfile.dateOfBirth ? new Date(selectedPatientProfile.dateOfBirth).toISOString().slice(0, 10) : '',
        gender: (selectedPatientProfile.gender as string) || '',
        address: selectedPatientProfile.address || '',
        occupation: selectedPatientProfile.occupation || '',
      }));
    }
  }, [selectedPatientProfile]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-8 py-6">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Yêu cầu đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Vui lòng đăng nhập để truy cập.</p>
            <Button asChild><a href="/login">Đăng nhập</a></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isReceptionist = user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN';
  if (!isReceptionist) {
    return (
      <div className="container mx-auto px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Không có quyền truy cập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Chỉ Lễ tân mới có quyền truy cập trang này.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resetCreateForm = () => {
    setCreateForm({ name: '', dateOfBirth: '', gender: '', address: '', occupation: '' });
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }
    if (!createForm.dateOfBirth) {
      toast.error('Vui lòng chọn ngày sinh');
      return;
    }
    if (!createForm.gender) {
      toast.error('Vui lòng chọn giới tính');
      return;
    }
    if (!createForm.address.trim()) {
      toast.error('Vui lòng nhập địa chỉ');
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: createForm.name.trim(),
        dateOfBirth: new Date(createForm.dateOfBirth + 'T00:00:00.000Z').toISOString(),
        gender: createForm.gender as 'male' | 'female' | 'other',
        address: createForm.address.trim(),
        occupation: createForm.occupation.trim(),
      };
      await patientProfileService.create(payload);
      toast.success('Tạo hồ sơ thành công');
      setShowCreateProfile(false);
      resetCreateForm();
    } catch (e) {
      console.error('Create profile error', e);
      toast.error('Không thể tạo hồ sơ');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-8 py-6 space-y-6 bg-white">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý hồ sơ bệnh nhân</h1>
          <p className="text-gray-600">Tìm kiếm, xem chi tiết và tạo hồ sơ mới</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          Lễ tân
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Tìm kiếm & chọn bệnh nhân
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setSelectedPatientProfile(null); setSelectedPatient(null); }}>Xoá trắng</Button>
              <Button size="sm" onClick={() => setShowCreateProfile(true)} className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Tạo hồ sơ
              </Button>
            </div>
          </div>
          <PatientSearch
            onPatientProfileSelect={setSelectedPatientProfile}
            selectedPatientProfile={selectedPatientProfile}
            onPatientSelect={setSelectedPatient}
            selectedPatient={selectedPatient}
          />
        </CardContent>
      </Card>

      {selectedPatientProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Thông tin hồ sơ</h2>
                <p className="text-gray-600">{selectedPatientProfile.name} • {selectedPatientProfile.profileCode}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatientProfileCard patientProfileId={selectedPatientProfile.id} showActions={false} />
          </CardContent>
        </Card>
      )}

      {/* Create Profile Dialog */}
      <Dialog open={showCreateProfile} onOpenChange={setShowCreateProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo hồ sơ bệnh nhân</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Họ và tên <span className="text-red-500">*</span></Label>
                <Input value={createForm.name} onChange={(e)=>setCreateForm({...createForm, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Ngày sinh <span className="text-red-500">*</span></Label>
                <Input type="date" value={createForm.dateOfBirth} onChange={(e)=>setCreateForm({...createForm, dateOfBirth: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Giới tính <span className="text-red-500">*</span></Label>
                <Select value={createForm.gender} onValueChange={(v)=>setCreateForm({...createForm, gender: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Nghề nghiệp</Label>
                <Input value={createForm.occupation} onChange={(e)=>setCreateForm({...createForm, occupation: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Địa chỉ <span className="text-red-500">*</span></Label>
              <Input value={createForm.address} onChange={(e)=>setCreateForm({...createForm, address: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowCreateProfile(false)}>Đóng</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Đang tạo...' : 'Tạo hồ sơ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


