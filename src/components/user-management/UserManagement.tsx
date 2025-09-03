'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Shield,
  Phone,
  Mail,
  MapPin,
  IdCard
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { adminApi, receptionistApi } from '@/lib/api';
import { toast } from 'sonner';


interface UserData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  citizenId?: string;
  avatar?: string;
  loyaltyPoints?: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserForm {
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  citizenId: string;
  avatar: string;
  password: string;
  email: string;
  phone: string;
  role: string;
  loyaltyPoints: number; // patient
  // doctor
  degrees: string; // comma-separated
  yearsExperience: string; // numeric string
  workHistory: string;
  description: string;
  // admin
  adminCode: string;
}

interface UpdateUserForm {
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  citizenId: string;
  avatar: string;
  email: string;
  phone: string;
  password: string;
  // doctor
  degrees: string; // comma-separated
  yearsExperience: string; // numeric string
  workHistory: string;
  description: string;
  // patient
  loyaltyPoints: string; // numeric string
  // admin
  adminCode: string;
}

export function UserManagement() {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: '',
    dateOfBirth: new Date().toISOString().split('T')[0],
    gender: '',
    address: '',
    citizenId: '',
    avatar: '',
    password: '',
    email: '',
    phone: '',
    role: 'PATIENT',
    loyaltyPoints: 0,
    degrees: '',
    yearsExperience: '',
    workHistory: '',
    description: '',
    adminCode: '',
  });

  const [editForm, setEditForm] = useState<UpdateUserForm>({
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    citizenId: '',
    avatar: '',
    email: '',
    phone: '',
    password: '',
    degrees: '',
    yearsExperience: '',
    workHistory: '',
    description: '',
    loyaltyPoints: '',
    adminCode: '',
  });

  const isAdmin = hasRole('ADMIN');
  const isReceptionist = hasRole('RECEPTIONIST');

  const toUndefinedIfEmpty = (value: string | number | undefined | null) => {
    if (typeof value === 'string') return value.trim() === '' ? undefined : value.trim();
    return value ?? undefined;
  };

  const buildCreateDto = () => {
    const degreesRaw = toUndefinedIfEmpty(createForm.degrees);
    const degrees = typeof degreesRaw === 'string'
      ? degreesRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
      : undefined;

    return {
      name: createForm.name.trim(),
      dateOfBirth: new Date(createForm.dateOfBirth).toISOString(),
      gender: createForm.gender.trim(),
      address: createForm.address.trim(),
      citizenId: toUndefinedIfEmpty(createForm.citizenId),
      avatar: toUndefinedIfEmpty(createForm.avatar),
      password: createForm.password,
      email: toUndefinedIfEmpty(createForm.email),
      phone: toUndefinedIfEmpty(createForm.phone),
      role: createForm.role,
      // doctor
      degrees,
      yearsExperience: createForm.role === 'DOCTOR' ? (toUndefinedIfEmpty(createForm.yearsExperience) ? Number(createForm.yearsExperience) : undefined) : undefined,
      workHistory: createForm.role === 'DOCTOR' ? toUndefinedIfEmpty(createForm.workHistory) : undefined,
      description: createForm.role === 'DOCTOR' ? toUndefinedIfEmpty(createForm.description) : undefined,
      // patient
      loyaltyPoints: createForm.role === 'PATIENT' ? (Number.isFinite(Number(createForm.loyaltyPoints)) ? Number(createForm.loyaltyPoints) : 0) : undefined,
      // admin
      adminCode: createForm.role === 'ADMIN' ? toUndefinedIfEmpty(createForm.adminCode) : undefined,
    } as Record<string, unknown>;
  };

  const buildReceptionistCreateDto = () => {
    // Receptionist endpoint expects only patient registration fields
    return {
      name: createForm.name.trim(),
      dateOfBirth: new Date(createForm.dateOfBirth).toISOString(),
      gender: createForm.gender.trim(),
      address: createForm.address.trim(),
      citizenId: toUndefinedIfEmpty(createForm.citizenId),
      avatar: toUndefinedIfEmpty(createForm.avatar),
      phone: toUndefinedIfEmpty(createForm.phone),
      email: toUndefinedIfEmpty(createForm.email),
      password: createForm.password,
    } as Record<string, unknown>;
  };

  const buildUpdateDto = () => {
    const dto: Record<string, unknown> = {};
    if (editForm.name.trim()) dto.name = editForm.name.trim();
    if (editForm.dateOfBirth) dto.dateOfBirth = new Date(editForm.dateOfBirth).toISOString();
    if (editForm.gender) dto.gender = editForm.gender;
    if (editForm.address) dto.address = editForm.address;
    if (editForm.citizenId) dto.citizenId = editForm.citizenId;
    if (editForm.avatar) dto.avatar = editForm.avatar;
    if (editForm.password) dto.password = editForm.password;
    if (editForm.email) dto.email = editForm.email;
    if (editForm.phone) dto.phone = editForm.phone;
    // doctor
    if (editForm.degrees) dto.degrees = editForm.degrees.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (editForm.yearsExperience) dto.yearsExperience = Number(editForm.yearsExperience);
    if (editForm.workHistory) dto.workHistory = editForm.workHistory;
    if (editForm.description) dto.description = editForm.description;
    // patient
    if (editForm.loyaltyPoints) dto.loyaltyPoints = Number(editForm.loyaltyPoints);
    // admin
    if (editForm.adminCode) dto.adminCode = editForm.adminCode;
    return dto;
  };

  const filterUsers = useCallback(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.phone || '').includes(searchTerm) ||
        (user.citizenId || '').includes(searchTerm)
      );
    }
    
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    const id = setTimeout(() => filterUsers(), 300);
    return () => clearTimeout(id);
  }, [searchTerm, roleFilter, filterUsers]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      let response;
      
      if (isAdmin) {
        response = await adminApi.getAllUsers({ role: roleFilter || undefined, page, limit });
      } else {
        // Receptionist: use own endpoint to list users/patients with pagination
        response = await receptionistApi.getUsers({ role: roleFilter || undefined, page, limit });
      }
      
      const payload = response.data as { data?: UserData[]; meta?: { total: number; page: number; limit: number } } | UserData[];
      if (Array.isArray(payload)) {
        setUsers(payload);
        setTotal(payload.length);
      } else {
        setUsers(payload.data || []);
        setTotal(payload.meta?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, roleFilter, page, limit]);

  useEffect(() => {
    if (isAdmin || isReceptionist) {
      fetchUsers();
    }
  }, [isAdmin, isReceptionist, fetchUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);


  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      if (isAdmin) {
        const userData = buildCreateDto() as Parameters<typeof adminApi.createUser>[0];
        await adminApi.createUser(userData);
        toast.success('Tạo người dùng thành công');
      } else if (isReceptionist) {
        const patientData = buildReceptionistCreateDto() as Parameters<typeof receptionistApi.registerPatient>[0];
        await receptionistApi.registerPatient(patientData);
        toast.success('Đăng ký bệnh nhân thành công');
      }
      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Không thể tạo người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      setIsLoading(true);
      if (isAdmin) {
        const updateData = buildUpdateDto() as Parameters<typeof adminApi.updateUser>[1];
        await adminApi.updateUser(selectedUser.id, updateData);
        toast.success('Cập nhật người dùng thành công');
      } else if (isReceptionist) {
        const updatePatient = buildUpdateDto() as Parameters<typeof receptionistApi.updatePatient>[1];
        await receptionistApi.updatePatient(selectedUser.id, updatePatient);
        toast.success('Cập nhật bệnh nhân thành công');
      }
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Không thể cập nhật người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !isAdmin) return;
    
    try {
      setIsLoading(true);
      await adminApi.deleteUser(selectedUser.id);
      toast.success('Xóa người dùng thành công');
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Không thể xóa người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const resetCreateForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setCreateForm({
      name: '',
      dateOfBirth: today,
      gender: '',
      address: '',
      citizenId: '',
      avatar: '',
      password: '',
      email: '',
      phone: '',
      role: 'PATIENT',
      loyaltyPoints: 0,
      degrees: '',
      yearsExperience: '',
      workHistory: '',
      description: '',
      adminCode: '',
    });
  };

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      gender: user.gender || '',
      address: user.address || '',
      citizenId: user.citizenId || '',
      avatar: user.avatar || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      degrees: '',
      yearsExperience: '',
      workHistory: '',
      description: '',
      loyaltyPoints: typeof user.loyaltyPoints === 'number' ? String(user.loyaltyPoints) : '',
      adminCode: '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'DOCTOR': return 'default';
      case 'RECEPTIONIST': return 'secondary';
      case 'PATIENT': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'DOCTOR': return 'Bác sĩ';
      case 'RECEPTIONIST': return 'Lễ tân';
      case 'PATIENT': return 'Bệnh nhân';
      default: return role;
    }
  };

  if (!isAdmin && !isReceptionist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Không có quyền truy cập
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Chỉ quản trị viên và lễ tân mới có quyền truy cập quản lý người dùng.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Quản lý người dùng' : 'Quản lý bệnh nhân'}
          </h2>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Quản lý tất cả người dùng trong hệ thống' 
              : 'Đăng ký và quản lý thông tin bệnh nhân'
            }
          </p>
        </div>
        <Button onClick={() => {
          resetCreateForm(); // Reset form khi mở dialog
          setIsCreateDialogOpen(true);
        }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {isAdmin ? 'Tạo người dùng' : 'Đăng ký bệnh nhân'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2.5">Tìm kiếm</Label>
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
            {isAdmin && (
              <div className="w-full sm:w-48">
                <Label htmlFor="role-filter" className="mb-2.5">Chức vụ</Label>
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value === 'ALL' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                    <SelectItem value="DOCTOR">Bác sĩ</SelectItem>
                    <SelectItem value="RECEPTIONIST">Lễ tân</SelectItem>
                    <SelectItem value="PATIENT">Bệnh nhân</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Danh sách người dùng ({total})
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Trang</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</Button>
                <span className="px-2">{page}</span>
                <Button variant="outline" size="sm" disabled={(page * limit) >= total} onClick={() => setPage((p) => p + 1)}>Sau</Button>
              </div>
              <Select value={String(limit)} onValueChange={(v) => { setPage(1); setLimit(Number(v)); }}>
                <SelectTrigger className="w-20 h-8"><SelectValue placeholder="10" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="overflow-x-auto rounded-lg border shadow-sm">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Thông tin liên hệ</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-40" />
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-3 w-52" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-3 w-20" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-medium">Không tìm thấy người dùng</p>
              <p className="text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border shadow-sm">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Thông tin liên hệ</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3 ml-2.5">
                          <Avatar className="h-10 w-10 ring-1 ring-gray-200">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <IdCard className="h-3 w-3" />
                              {user.citizenId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {user.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="truncate max-w-[200px]">{user.address}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        {user.loyaltyPoints !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            Điểm tích lũy: {user.loyaltyPoints}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Chỉnh sửa</TooltipContent>
                            </Tooltip>
                            {isAdmin && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeleteDialog(user)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Xóa</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAdmin ? 'Tạo người dùng mới' : 'Đăng ký bệnh nhân mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Họ và tên <span className="text-red-500">*</span></Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  placeholder="Nhập họ và tên"
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  placeholder="email@domain.com"
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">Số điện thoại <span className="text-red-500">*</span></Label>
                <Input
                  id="create-phone"
                  value={createForm.phone}
                  placeholder="0123 456 789"
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Mật khẩu <span className="text-red-500">*</span></Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  placeholder="Tối thiểu 8 ký tự"
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-dateOfBirth">Ngày sinh <span className="text-red-500">*</span></Label>
                <Input
                  id="create-dateOfBirth"
                  type="date"
                  value={createForm.dateOfBirth}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
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
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="create-role">Vai trò <span className="text-red-500">*</span></Label>
                  <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PATIENT">Bệnh nhân</SelectItem>
                      <SelectItem value="DOCTOR">Bác sĩ</SelectItem>
                      <SelectItem value="RECEPTIONIST">Lễ tân</SelectItem>
                      <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="create-citizenId">CCCD/CMND <span className="text-red-500">*</span></Label>
                <Input
                  id="create-citizenId"
                  value={createForm.citizenId}
                  placeholder="Số CCCD/CMND"
                  onChange={(e) => setCreateForm({ ...createForm, citizenId: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-address">Địa chỉ <span className="text-red-500">*</span></Label>
              <Input
                id="create-address"
                value={createForm.address}
                placeholder="Địa chỉ cư trú"
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-avatar">Avatar URL</Label>
              <Input
                id="create-avatar"
                value={createForm.avatar}
                onChange={(e) => setCreateForm({ ...createForm, avatar: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="create-loyaltyPoints">Điểm tích lũy</Label>
                <Input
                  id="create-loyaltyPoints"
                  type="number"
                  value={createForm.loyaltyPoints}
                  onChange={(e) => setCreateForm({ ...createForm, loyaltyPoints: parseInt(e.target.value) || 0 })}
                  min="0"
                  placeholder="0"
                />
              </div>
            )}
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="create-adminCode">Mã quản trị</Label>
                <Input
                  id="create-adminCode"
                  value={createForm.adminCode}
                  onChange={(e) => setCreateForm({ ...createForm, adminCode: e.target.value })}
                  placeholder="Nhập mã quản trị (nếu có)"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateUser} disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : (isAdmin ? 'Tạo người dùng' : 'Đăng ký bệnh nhân')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Họ và tên <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  placeholder="Nhập họ và tên"
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  placeholder="email@domain.com"
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Số điện thoại <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  placeholder="0123 456 789"
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Mật khẩu mới</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Để trống nếu không thay đổi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dateOfBirth">Ngày sinh <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-dateOfBirth"
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gender">Giới tính <span className="text-red-500">*</span></Label>
                <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
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
                <Label htmlFor="edit-citizenId">CCCD/CMND <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-citizenId"
                  value={editForm.citizenId}
                  onChange={(e) => setEditForm({ ...editForm, citizenId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-avatar">Avatar URL</Label>
                <Input
                  id="edit-avatar"
                  value={editForm.avatar}
                  onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Địa chỉ <span className="text-red-500">*</span></Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                required
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="edit-adminCode">Mã quản trị</Label>
                <Input
                  id="edit-adminCode"
                  value={editForm.adminCode}
                  onChange={(e) => setEditForm({ ...editForm, adminCode: e.target.value })}
                  placeholder="Nhập mã quản trị (nếu có)"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateUser} disabled={isLoading}>
              {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser} 
              disabled={isLoading}
            >
              {isLoading ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
