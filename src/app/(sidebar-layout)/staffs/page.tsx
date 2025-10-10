'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Users,
  X,
  UserPlus,
  Award,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  staffService,
  type Role,
  type CertificateType,
  type Certificate,
  type CreateStaffDto,
  type UpdateStaffDto,
  type StaffMember,
} from '@/lib/services/staff.service';
import { specialtiesService } from '@/lib/services/services.service';

interface Specialty {
  id: string;
  name: string;
  description?: string;
}

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateStaffDto>({
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    role: 'RECEPTIONIST',
    phone: '',
    email: '',
    avatar: '',
    citizenId: '',
    doctorInfo: undefined,
    adminInfo: undefined,
    technicianInfo: undefined,
    receptionistInfo: undefined,
    cashierInfo: undefined,
    certificates: undefined,
  });

  const [editForm, setEditForm] = useState<UpdateStaffDto>({});

  const [certificates, setCertificates] = useState<Omit<Certificate, 'id'>[]>([]);
  const [editCertificates, setEditCertificates] = useState<Omit<Certificate, 'id'>[]>([]);

  // Load specialties on mount
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const response = await specialtiesService.listSpecialties(1, 100);
        setSpecialties(response.data || []);
      } catch (error) {
        console.error('Error loading specialties:', error);
        toast.error('Không thể tải danh sách chuyên khoa');
      }
    };
    loadSpecialties();
  }, []);

  // Fetch staff list
  const fetchStaffList = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await staffService.getAll({
        role: roleFilter as Role | undefined,
        page,
        limit,
      });
      const { data, meta } = response.data;
      
      setStaffList(data || []);
      setTotal(meta?.total || 0);
      setTotalPages(meta?.totalPages || 0);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Không thể tải danh sách nhân viên');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, roleFilter]);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  // Filter staff by search term (client-side)
  const filteredStaff = staffList.filter(staff => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      staff.name?.toLowerCase().includes(search) ||
      staff.email?.toLowerCase().includes(search) ||
      staff.phone?.includes(search) ||
      staff.citizenId?.includes(search)
    );
  });

  // Email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10,11}$/;

  // Validate form
  const validateCreateForm = (): boolean => {
    if (!createForm.name.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return false;
    }
    if (!createForm.dateOfBirth) {
      toast.error('Vui lòng chọn ngày sinh');
      return false;
    }
    if (!createForm.gender) {
      toast.error('Vui lòng chọn giới tính');
      return false;
    }
    if (!createForm.address.trim()) {
      toast.error('Vui lòng nhập địa chỉ');
      return false;
    }
    if (createForm.email && !emailRegex.test(createForm.email)) {
      toast.error('Email không hợp lệ');
      return false;
    }
    if (createForm.phone && !phoneRegex.test(createForm.phone)) {
      toast.error('Số điện thoại phải có 10-11 chữ số');
      return false;
    }
    if (!createForm.citizenId?.trim()) {
      toast.error('Vui lòng nhập CCCD/CMND');
      return false;
    }

    // Validate role-specific fields
    if (createForm.role === 'DOCTOR') {
      if (!createForm.doctorInfo?.specialtyId) {
        toast.error('Vui lòng chọn chuyên khoa cho bác sĩ');
        return false;
      }
    }

    // Validate certificates
    for (const cert of certificates) {
      if (!cert.title.trim()) {
        toast.error('Vui lòng nhập tên chứng chỉ');
        return false;
      }
      if (!cert.type) {
        toast.error('Vui lòng chọn loại chứng chỉ');
        return false;
      }
      if (!cert.issuedBy?.trim()) {
        toast.error('Vui lòng nhập tổ chức cấp chứng chỉ');
        return false;
      }
      if (!cert.issuedAt) {
        toast.error('Vui lòng chọn ngày cấp chứng chỉ');
        return false;
      }
    }

    return true;
  };

  // Handle create staff
  const handleCreateStaff = async () => {
    if (!validateCreateForm()) return;

    try {
      setIsLoading(true);
      const payload: CreateStaffDto = {
        ...createForm,
        certificates: certificates.length > 0 ? certificates : undefined,
      };

      // Add role-specific info
      if (createForm.role === 'DOCTOR' && createForm.doctorInfo) {
        payload.doctorInfo = {
          ...createForm.doctorInfo,
          rating: 0, // Default rating as per requirement
        };
      } else if (createForm.role === 'ADMIN') {
        payload.adminInfo = createForm.adminInfo || {};
      } else if (createForm.role === 'TECHNICIAN') {
        payload.technicianInfo = {};
      } else if (createForm.role === 'RECEPTIONIST') {
        payload.receptionistInfo = {};
      } else if (createForm.role === 'CASHIER') {
        payload.cashierInfo = {};
      }

      await staffService.create(payload);
      toast.success('Tạo nhân viên thành công');
      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchStaffList();
    } catch (error: unknown) {
      console.error('Error creating staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo nhân viên';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update staff
  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;

    try {
      setIsLoading(true);
      const payload: UpdateStaffDto = {
        ...editForm,
        certificates: editCertificates.length > 0 ? editCertificates : undefined,
        replaceAllCertificates: false,
      };

      await staffService.update(selectedStaff.id, payload);
      toast.success('Cập nhật nhân viên thành công');
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
      fetchStaffList();
    } catch (error: unknown) {
      console.error('Error updating staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật nhân viên';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete (deactivate) staff
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      setIsLoading(true);
      await staffService.delete(selectedStaff.id);
      toast.success('Vô hiệu hóa nhân viên thành công');
      setIsDeleteDialogOpen(false);
      setSelectedStaff(null);
      fetchStaffList();
    } catch (error: unknown) {
      console.error('Error deleting staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể vô hiệu hóa nhân viên';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      role: 'RECEPTIONIST',
      phone: '',
      email: '',
      avatar: '',
      citizenId: '',
      doctorInfo: undefined,
      adminInfo: undefined,
      technicianInfo: undefined,
      receptionistInfo: undefined,
      cashierInfo: undefined,
      certificates: undefined,
    });
    setCertificates([]);
  };

  // Open edit dialog
  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    
    const roleInfo = staff.doctor || staff.technician || staff.receptionist || staff.cashier || staff.admin;
    const currentCerts = (staff.doctor?.certificates || staff.technician?.certificates || [])
      .map(cert => ({
        code: cert.code || '',
        title: cert.title || '',
        type: cert.type || 'DEGREE',
        issuedBy: cert.issuedBy || '',
        issuedAt: cert.issuedAt || '',
        expiryAt: cert.expiryAt || '',
        file: cert.file || '',
        description: cert.description || '',
      }));

    setEditForm({
      name: staff.name,
      dateOfBirth: staff.dateOfBirth?.split('T')[0],
      gender: staff.gender,
      address: staff.address,
      phone: staff.phone,
      email: staff.email,
      avatar: staff.avatar,
      citizenId: staff.citizenId,
      doctorInfo: staff.doctor ? {
        specialtyId: staff.doctor.specialtyId,
        yearsExperience: staff.doctor.yearsExperience,
        workHistory: staff.doctor.workHistory,
        description: staff.doctor.description,
        subSpecialties: staff.doctor.subSpecialties,
        licenseNumber: staff.doctor.licenseNumber,
        licenseIssuedAt: staff.doctor.licenseIssuedAt?.split('T')[0],
        licenseExpiry: staff.doctor.licenseExpiry?.split('T')[0],
        department: staff.doctor.department,
        position: staff.doctor.position,
        isActive: staff.doctor.isActive,
      } : undefined,
      adminInfo: staff.admin ? {
        position: staff.admin.position,
        isActive: staff.admin.isActive,
      } : undefined,
      technicianInfo: staff.technician ? {
        isActive: staff.technician.isActive,
      } : undefined,
      receptionistInfo: staff.receptionist ? {
        isActive: staff.receptionist.isActive,
      } : undefined,
      cashierInfo: staff.cashier ? {
        isActive: staff.cashier.isActive,
      } : undefined,
    });
    setEditCertificates(currentCerts);
    setIsEditDialogOpen(true);
  };

  // Add certificate
  const addCertificate = (isEdit = false) => {
    const newCert: Omit<Certificate, 'id'> = {
      code: '',
      title: '',
      type: 'DEGREE',
      issuedBy: '',
      issuedAt: '',
      expiryAt: '',
      file: '',
      description: '',
    };
    if (isEdit) {
      setEditCertificates([...editCertificates, newCert]);
    } else {
      setCertificates([...certificates, newCert]);
    }
  };

  // Remove certificate
  const removeCertificate = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditCertificates(editCertificates.filter((_, i) => i !== index));
    } else {
      setCertificates(certificates.filter((_, i) => i !== index));
    }
  };

  // Update certificate
  const updateCertificate = (index: number, field: keyof Certificate, value: string, isEdit = false) => {
    if (isEdit) {
      const updated = [...editCertificates];
      updated[index] = { ...updated[index], [field]: value };
      setEditCertificates(updated);
    } else {
      const updated = [...certificates];
      updated[index] = { ...updated[index], [field]: value };
      setCertificates(updated);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'DOCTOR': return 'default';
      case 'TECHNICIAN': return 'secondary';
      case 'RECEPTIONIST': return 'secondary';
      case 'CASHIER': return 'secondary';
      default: return 'outline';
    }
  };

  // Get role label
  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'DOCTOR': return 'Bác sĩ';
      case 'TECHNICIAN': return 'Kỹ thuật viên';
      case 'RECEPTIONIST': return 'Lễ tân';
      case 'CASHIER': return 'Thu ngân';
      default: return role;
    }
  };

  // Get certificate type label
  const getCertificateTypeLabel = (type: CertificateType) => {
    switch (type) {
      case 'LICENSE': return 'Chứng chỉ hành nghề';
      case 'DEGREE': return 'Văn bằng';
      case 'TRAINING': return 'Đào tạo';
      case 'OTHER': return 'Khác';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân viên</h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin nhân viên phòng khám
          </p>
        </div>
        <Button onClick={() => {
          resetCreateForm();
          setIsCreateDialogOpen(true);
        }} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2 block">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Tìm theo tên, email, SĐT, CCCD..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="role-filter" className="mb-2 block">Vai trò</Label>
              <Select value={roleFilter} onValueChange={(value) => {
                setRoleFilter(value === 'ALL' ? '' : value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="DOCTOR">Bác sĩ</SelectItem>
                  <SelectItem value="TECHNICIAN">Kỹ thuật viên</SelectItem>
                  <SelectItem value="RECEPTIONIST">Lễ tân</SelectItem>
                  <SelectItem value="CASHIER">Thu ngân</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Danh sách nhân viên ({total})
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)}
              >
                Trước
              </Button>
              <span className="px-2">Trang {page} / {totalPages}</span>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)}
              >
                Sau
              </Button>
              <Select value={String(limit)} onValueChange={(v) => { 
                setPage(1); 
                setLimit(Number(v)); 
              }}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">Không tìm thấy nhân viên</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc thêm nhân viên mới.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Liên hệ</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff) => {
                    const roleInfo = staff.doctor || staff.technician || staff.receptionist || staff.cashier || staff.admin;
                    const isActive = roleInfo && 'isActive' in roleInfo ? roleInfo.isActive : true;

                    return (
                      <TableRow key={staff.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={staff.avatar} alt={staff.name} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{staff.name}</div>
                              <div className="text-sm text-gray-500">{staff.citizenId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {staff.email && <div>{staff.email}</div>}
                            {staff.phone && <div>{staff.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(staff.role)}>
                            {getRoleLabel(staff.role)}
                          </Badge>
                          {staff.doctor && (
                            <div className="text-xs text-gray-500 mt-1">
                              {staff.doctor.doctorCode}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive ? 'default' : 'secondary'}>
                            {isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex items-center justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(staff)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Chỉnh sửa</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedStaff(staff);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Vô hiệu hóa</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Staff Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[50vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Thêm nhân viên mới
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Họ và tên <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-dateOfBirth">Ngày sinh <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-dateOfBirth"
                    type="date"
                    value={createForm.dateOfBirth}
                    onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-gender">Giới tính <span className="text-red-500">*</span></Label>
                  <Select value={createForm.gender} onValueChange={(value) => setCreateForm({ ...createForm, gender: value })}>
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
                  <Label htmlFor="create-citizenId">CCCD/CMND <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-citizenId"
                    value={createForm.citizenId || ''}
                    onChange={(e) => setCreateForm({ ...createForm, citizenId: e.target.value })}
                    placeholder="001234567890"
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="create-address">Địa chỉ <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-address"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">Vai trò <span className="text-red-500">*</span></Label>
                  <Select value={createForm.role} onValueChange={(value: Role) => {
                    setCreateForm({ 
                      ...createForm, 
                      role: value,
                      doctorInfo: value === 'DOCTOR' ? { specialtyId: '', yearsExperience: 0 } : undefined,
                      adminInfo: value === 'ADMIN' ? { position: '' } : undefined,
                    });
                    setCertificates([]);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR">Bác sĩ</SelectItem>
                      <SelectItem value="TECHNICIAN">Kỹ thuật viên</SelectItem>
                      <SelectItem value="RECEPTIONIST">Lễ tân</SelectItem>
                      <SelectItem value="CASHIER">Thu ngân</SelectItem>
                      <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin liên hệ</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-phone">Số điện thoại <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-phone"
                    value={createForm.phone || ''}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0901234567"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email || ''}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="create-avatar">Avatar URL</Label>
                  <Input
                    id="create-avatar"
                    value={createForm.avatar || ''}
                    onChange={(e) => setCreateForm({ ...createForm, avatar: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Doctor-specific fields */}
            {createForm.role === 'DOCTOR' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Thông tin bác sĩ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-specialtyId">Chuyên khoa <span className="text-red-500">*</span></Label>
                    <Select 
                      value={createForm.doctorInfo?.specialtyId} 
                      onValueChange={(value) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, specialtyId: value } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chuyên khoa" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-yearsExperience">Số năm kinh nghiệm <span className="text-red-500">*</span></Label>
                    <Input
                      id="create-yearsExperience"
                      type="number"
                      min="0"
                      value={createForm.doctorInfo?.yearsExperience || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, yearsExperience: Number(e.target.value) } 
                      })}
                      placeholder="10"
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="create-workHistory">Lịch sử công tác <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="create-workHistory"
                      value={createForm.doctorInfo?.workHistory || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, workHistory: e.target.value } 
                      })}
                      placeholder="Bệnh viện A (2010-2020), Phòng khám B (2020-nay)"
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="create-description">Mô tả <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="create-description"
                      value={createForm.doctorInfo?.description || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, description: e.target.value } 
                      })}
                      placeholder="Chuyên gia điều trị bệnh tim mạch"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-licenseNumber">Số giấy phép</Label>
                    <Input
                      id="create-licenseNumber"
                      value={createForm.doctorInfo?.licenseNumber || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, licenseNumber: e.target.value } 
                      })}
                      placeholder="BYT-12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-licenseIssuedAt">Ngày cấp giấy phép</Label>
                    <Input
                      id="create-licenseIssuedAt"
                      type="date"
                      value={createForm.doctorInfo?.licenseIssuedAt || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, licenseIssuedAt: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-department">Khoa</Label>
                    <Input
                      id="create-department"
                      value={createForm.doctorInfo?.department || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, department: e.target.value } 
                      })}
                      placeholder="Khoa Nội"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-position">Chức danh</Label>
                    <Input
                      id="create-position"
                      value={createForm.doctorInfo?.position || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, position: e.target.value } 
                      })}
                      placeholder="Trưởng khoa"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Admin-specific fields */}
            {createForm.role === 'ADMIN' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Thông tin quản trị</h3>
                <div className="space-y-2">
                  <Label htmlFor="create-admin-position">Vị trí/Chức danh</Label>
                  <Input
                    id="create-admin-position"
                    value={createForm.adminInfo?.position || ''}
                    onChange={(e) => setCreateForm({ 
                      ...createForm, 
                      adminInfo: { ...createForm.adminInfo, position: e.target.value } 
                    })}
                    placeholder="Quản lý hệ thống"
                  />
                </div>
              </div>
            )}

            {/* Certificates (for DOCTOR and TECHNICIAN) */}
            {(createForm.role === 'DOCTOR' || createForm.role === 'TECHNICIAN') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Chứng chỉ
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => addCertificate(false)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm chứng chỉ
                  </Button>
                </div>
                {certificates.map((cert, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Chứng chỉ {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertificate(index, false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tên chứng chỉ <span className="text-red-500">*</span></Label>
                          <Input
                            value={cert.title || ''}
                            onChange={(e) => updateCertificate(index, 'title', e.target.value, false)}
                            placeholder="Bằng Tiến sĩ Y khoa"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Loại chứng chỉ <span className="text-red-500">*</span></Label>
                          <Select 
                            value={cert.type || 'DEGREE'} 
                            onValueChange={(value) => updateCertificate(index, 'type', value, false)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LICENSE">Chứng chỉ hành nghề</SelectItem>
                              <SelectItem value="DEGREE">Văn bằng</SelectItem>
                              <SelectItem value="TRAINING">Đào tạo</SelectItem>
                              <SelectItem value="OTHER">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Mã chứng chỉ</Label>
                          <Input
                            value={cert.code || ''}
                            onChange={(e) => updateCertificate(index, 'code', e.target.value, false)}
                            placeholder="CERT-001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tổ chức cấp <span className="text-red-500">*</span></Label>
                          <Input
                            value={cert.issuedBy || ''}
                            onChange={(e) => updateCertificate(index, 'issuedBy', e.target.value, false)}
                            placeholder="Đại học Y Hà Nội"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày cấp <span className="text-red-500">*</span></Label>
                          <Input
                            type="date"
                            value={cert.issuedAt || ''}
                            onChange={(e) => updateCertificate(index, 'issuedAt', e.target.value, false)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày hết hạn</Label>
                          <Input
                            type="date"
                            value={cert.expiryAt || ''}
                            onChange={(e) => updateCertificate(index, 'expiryAt', e.target.value, false)}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>File URL</Label>
                          <Input
                            value={cert.file || ''}
                            onChange={(e) => updateCertificate(index, 'file', e.target.value, false)}
                            placeholder="https://example.com/certificate.pdf"
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Mô tả</Label>
                          <Textarea
                            value={cert.description || ''}
                            onChange={(e) => updateCertificate(index, 'description', e.target.value, false)}
                            placeholder="Mô tả về chứng chỉ"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateStaff} disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : 'Tạo nhân viên'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[50vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Cập nhật thông tin nhân viên
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Họ và tên</Label>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ngày sinh</Label>
                  <Input
                    type="date"
                    value={editForm.dateOfBirth || ''}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giới tính</Label>
                  <Select value={editForm.gender || ''} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
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
                  <Label>CCCD/CMND</Label>
                  <Input
                    value={editForm.citizenId || ''}
                    onChange={(e) => setEditForm({ ...editForm, citizenId: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Địa chỉ</Label>
                  <Input
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin liên hệ</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Avatar URL</Label>
                  <Input
                    value={editForm.avatar || ''}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Doctor-specific fields */}
            {selectedStaff?.role === 'DOCTOR' && editForm.doctorInfo && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Thông tin bác sĩ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Chuyên khoa</Label>
                    <Select 
                      value={editForm.doctorInfo?.specialtyId || ''} 
                      onValueChange={(value) => setEditForm({ 
                        ...editForm, 
                        doctorInfo: { ...editForm.doctorInfo, specialtyId: value } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Số năm kinh nghiệm</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editForm.doctorInfo?.yearsExperience || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        doctorInfo: { ...editForm.doctorInfo, yearsExperience: Number(e.target.value) } 
                      })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Lịch sử công tác</Label>
                    <Textarea
                      value={editForm.doctorInfo?.workHistory || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        doctorInfo: { ...editForm.doctorInfo, workHistory: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Mô tả</Label>
                    <Textarea
                      value={editForm.doctorInfo?.description || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        doctorInfo: { ...editForm.doctorInfo, description: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <Select 
                      value={editForm.doctorInfo?.isActive ? 'true' : 'false'} 
                      onValueChange={(value) => setEditForm({ 
                        ...editForm, 
                        doctorInfo: { ...editForm.doctorInfo, isActive: value === 'true' } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Vô hiệu hóa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Status for other roles */}
            {selectedStaff?.role === 'TECHNICIAN' && editForm.technicianInfo && (
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select 
                  value={editForm.technicianInfo?.isActive ? 'true' : 'false'} 
                  onValueChange={(value) => setEditForm({ 
                    ...editForm, 
                    technicianInfo: { isActive: value === 'true' } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Vô hiệu hóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStaff?.role === 'RECEPTIONIST' && editForm.receptionistInfo && (
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select 
                  value={editForm.receptionistInfo?.isActive ? 'true' : 'false'} 
                  onValueChange={(value) => setEditForm({ 
                    ...editForm, 
                    receptionistInfo: { isActive: value === 'true' } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Vô hiệu hóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStaff?.role === 'CASHIER' && editForm.cashierInfo && (
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select 
                  value={editForm.cashierInfo?.isActive ? 'true' : 'false'} 
                  onValueChange={(value) => setEditForm({ 
                    ...editForm, 
                    cashierInfo: { isActive: value === 'true' } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Vô hiệu hóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStaff?.role === 'ADMIN' && editForm.adminInfo && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Thông tin quản trị</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vị trí/Chức danh</Label>
                    <Input
                      value={editForm.adminInfo?.position || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        adminInfo: { ...editForm.adminInfo, position: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <Select 
                      value={editForm.adminInfo?.isActive ? 'true' : 'false'} 
                      onValueChange={(value) => setEditForm({ 
                        ...editForm, 
                        adminInfo: { ...editForm.adminInfo, isActive: value === 'true' } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Vô hiệu hóa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Certificates (for DOCTOR and TECHNICIAN) */}
            {(selectedStaff?.role === 'DOCTOR' || selectedStaff?.role === 'TECHNICIAN') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Chứng chỉ
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => addCertificate(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm chứng chỉ
                  </Button>
                </div>
                {editCertificates.map((cert, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Chứng chỉ {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertificate(index, true)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tên chứng chỉ</Label>
                          <Input
                            value={cert.title || ''}
                            onChange={(e) => updateCertificate(index, 'title', e.target.value, true)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Loại chứng chỉ</Label>
                          <Select 
                            value={cert.type || 'DEGREE'} 
                            onValueChange={(value) => updateCertificate(index, 'type', value, true)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LICENSE">Chứng chỉ hành nghề</SelectItem>
                              <SelectItem value="DEGREE">Văn bằng</SelectItem>
                              <SelectItem value="TRAINING">Đào tạo</SelectItem>
                              <SelectItem value="OTHER">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tổ chức cấp</Label>
                          <Input
                            value={cert.issuedBy || ''}
                            onChange={(e) => updateCertificate(index, 'issuedBy', e.target.value, true)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày cấp</Label>
                          <Input
                            type="date"
                            value={cert.issuedAt || ''}
                            onChange={(e) => updateCertificate(index, 'issuedAt', e.target.value, true)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày hết hạn</Label>
                          <Input
                            type="date"
                            value={cert.expiryAt || ''}
                            onChange={(e) => updateCertificate(index, 'expiryAt', e.target.value, true)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>File URL</Label>
                          <Input
                            value={cert.file || ''}
                            onChange={(e) => updateCertificate(index, 'file', e.target.value, true)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateStaff} disabled={isLoading}>
              {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Staff Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận vô hiệu hóa nhân viên</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Bạn có chắc chắn muốn vô hiệu hóa nhân viên <strong>{selectedStaff?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Nhân viên sẽ không bị xóa khỏi hệ thống và có thể kích hoạt lại sau này.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteStaff} 
              disabled={isLoading}
            >
              {isLoading ? 'Đang vô hiệu hóa...' : 'Vô hiệu hóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

