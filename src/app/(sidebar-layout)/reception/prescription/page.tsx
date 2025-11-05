'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  GripVertical,
  ClipboardList,
  User,
  Loader2,
  List,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PatientSearch } from '@/components/medical-records/PatientSearch';
import { PatientProfile } from '@/lib/types/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MedicalRecord } from '@/lib/types/medical-record';

interface Service {
  id: string;
  serviceCode: string;
  name: string;
  description: string;
}

interface DoctorOption {
  doctorId: string;
  doctorCode: string;
  doctorName: string;
  boothId: string | null;
  boothCode: string | null;
  boothName: string | null;
  clinicRoomId: string | null;
  clinicRoomCode: string | null;
  clinicRoomName: string | null;
  workSessionId: string | null;
  workSessionStartTime: Date | null;
  workSessionEndTime: Date | null;
}

interface PrescriptionService {
  serviceCode: string;
  serviceId?: string;
  serviceName?: string;
  order: number;
  doctorId?: string;
}

interface PrescriptionServiceRequest {
  order: number;
  serviceCode?: string
  serviceId?: string;
  doctorId?: string;
}

interface PrescriptionData {
  patientProfileId: string;
  services: PrescriptionServiceRequest[];
}

// List types for prescriptions
interface PrescriptionListItem {
  id: string;
  medicalRecord?: MedicalRecord;
  createdAt?: string;
  status?: string;
  patientProfile?: { id: string; profileCode?: string; name?: string } | null;
  doctor?: { id: string; auth?: { name?: string } } | null;
  services?: Array<{ order: number; service?: { serviceCode?: string; name?: string } }> | null;
}

interface PrescriptionsListResponse {
  data: PrescriptionListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'
export default function ReceptionCreatePrescriptionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'prescriptions'>('create');

  // Patient selection
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedServices, setSelectedServices] = useState<PrescriptionService[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState<Record<string, boolean>>({});
  const [doctorsByService, setDoctorsByService] = useState<Record<string, DoctorOption[]>>({});

  // Prescriptions list states
  const [prescriptions, setPrescriptions] = useState<PrescriptionListItem[]>([]);
  const [prescriptionsTotal, setPrescriptionsTotal] = useState(0);
  const [prescriptionsPage, setPrescriptionsPage] = useState(1);
  const [prescriptionsLimit] = useState(20);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  // Search services with debouncing
  useEffect(() => {
    const searchServices = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`${API_BASE_URL}/services/search?query=${encodeURIComponent(searchQuery)}&limit=20`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data?.services || []);
        }
      } catch (error) {
        console.error('Error searching services:', error);
        toast.error('Có lỗi xảy ra khi tìm kiếm dịch vụ');
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchServices, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load doctors for a service (always fetch fresh data)
  const loadDoctorsForService = useCallback(async (serviceId: string) => {
    setLoadingDoctors(prev => ({ ...prev, [serviceId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions/doctors/by-service?serviceId=${encodeURIComponent(serviceId)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        const doctors = await response.json();
        setDoctorsByService(prev => ({ ...prev, [serviceId]: doctors }));
      } else {
        setDoctorsByService(prev => ({ ...prev, [serviceId]: [] }));
        toast.error('Không thể tải danh sách bác sĩ cho dịch vụ này');
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctorsByService(prev => ({ ...prev, [serviceId]: [] }));
      toast.error('Có lỗi xảy ra khi tải danh sách bác sĩ');
    } finally {
      setLoadingDoctors(prev => ({ ...prev, [serviceId]: false }));
    }
  }, []);

  const addService = useCallback((service: Service) => {
    const existingService = selectedServices.find(s => s.serviceCode === service.serviceCode);
    if (existingService) {
      toast.error('Dịch vụ này đã được thêm vào phiếu chỉ định');
      return;
    }

    const newService: PrescriptionService = {
      serviceCode: service.serviceCode,
      serviceId: service.id,
      serviceName: service.name,
      order: selectedServices.length + 1
    };

    setSelectedServices(prev => [...prev, newService]);
    setSearchQuery('');
    setSearchResults([]);

    // Load doctors for this service
    if (service.id) {
      loadDoctorsForService(service.id);
    }
  }, [selectedServices, loadDoctorsForService]);

  const removeService = useCallback((serviceCode: string) => {
    setSelectedServices(prev => {
      const filtered = prev.filter(s => s.serviceCode !== serviceCode);
      return filtered.map((service, index) => ({
        ...service,
        order: index + 1
      }));
    });
  }, []);

  const updateServiceDoctor = useCallback((serviceCode: string, doctorId: string | undefined) => {
    setSelectedServices(prev => prev.map(s => 
      s.serviceCode === serviceCode ? { ...s, doctorId } : s
    ));
  }, []);

  const handleCreatePrescription = async () => {
    if (!selectedPatientProfile) {
      toast.error('Vui lòng chọn hồ sơ bệnh nhân');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }

    // Validate and format services for API
    const formattedServices: PrescriptionServiceRequest[] = selectedServices.map(service => {
      const serviceId = service.serviceId ? String(service.serviceId).trim() : undefined;
      const serviceCode = service.serviceCode ? String(service.serviceCode).trim() : undefined;
      
      // Ensure we have at least one valid identifier (non-empty)
      if ((!serviceId || serviceId.length === 0) && (!serviceCode || serviceCode.length === 0)) {
        console.error('Service missing both serviceId and serviceCode:', service);
        return null;
      }

      const serviceData: PrescriptionServiceRequest = {
        order: service.order
      };
      
      // Prefer serviceId if available, otherwise use serviceCode
      // Include both if both are available (backend might need both)
      if (serviceId && serviceId.length > 0) {
        serviceData.serviceId = serviceId;
      }
      
      if (serviceCode && serviceCode.length > 0) {
        serviceData.serviceCode = serviceCode;
      }
      
      // Include doctorId if selected
      if (service.doctorId && service.doctorId.trim().length > 0) {
        serviceData.doctorId = String(service.doctorId).trim();
      }
      
      return serviceData;
    }).filter((s): s is PrescriptionServiceRequest => s !== null);

    // Final validation - each service must have at least serviceId or serviceCode
    const invalidServices = formattedServices.filter(s => {
      const hasServiceId = s.serviceId && s.serviceId.length > 0;
      const hasServiceCode = s.serviceCode && s.serviceCode.length > 0;
      return !hasServiceId && !hasServiceCode;
    });
    
    if (invalidServices.length > 0 || formattedServices.length !== selectedServices.length) {
      console.error('Invalid services:', invalidServices);
      console.error('All selected services:', selectedServices);
      console.error('All formatted services:', formattedServices);
      toast.error('Một số dịch vụ không có mã dịch vụ hợp lệ. Vui lòng thử lại.');
      return;
    }

    setIsCreating(true);
    try {
      const prescriptionData: PrescriptionData = {
        patientProfileId: selectedPatientProfile.id,
        services: formattedServices
      };

      console.log('Sending prescription data:', JSON.stringify(prescriptionData, null, 2));

      const response = await fetch(`${API_BASE_URL}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(prescriptionData)
      });

      if (response.ok) {
        toast.success('Tạo phiếu chỉ định thành công');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra khi tạo phiếu chỉ định');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Có lỗi xảy ra khi tạo phiếu chỉ định');
    } finally {
      setIsCreating(false);
    }
  };

  // Fetch prescriptions list
  const fetchPrescriptions = useCallback(async () => {
    setLoadingPrescriptions(true);
    try {
      const params = new URLSearchParams({
        page: String(prescriptionsPage),
        limit: String(prescriptionsLimit)
      });
      const res = await fetch(`${API_BASE_URL}/prescriptions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (res.ok) {
        const json: PrescriptionsListResponse = await res.json();
        setPrescriptions(json.data || []);
        setPrescriptionsTotal(json.meta?.total || 0);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Không thể tải danh sách phiếu chỉ định');
        setPrescriptions([]);
        setPrescriptionsTotal(0);
      }
    } catch (e) {
      console.error('Fetch prescriptions error', e);
      toast.error('Có lỗi xảy ra khi tải danh sách phiếu chỉ định');
      setPrescriptions([]);
      setPrescriptionsTotal(0);
    } finally {
      setLoadingPrescriptions(false);
    }
  }, [prescriptionsPage, prescriptionsLimit]);

  // When switching to prescriptions tab or page changes
  useEffect(() => {
    if (activeTab === 'prescriptions') {
      fetchPrescriptions();
    }
  }, [activeTab, fetchPrescriptions]);

  const handleBack = () => {
    router.push('/medical-records');
  };

  const prescriptionsTotalPages = Math.max(1, Math.ceil(prescriptionsTotal / prescriptionsLimit));

  return (
    <div className="container mx-auto py-6 px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-gray-300" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Phiếu chỉ định</h1>
            <p className="text-sm text-gray-600">
              {activeTab === 'create' 
                ? 'Chọn hồ sơ bệnh nhân, dịch vụ và bác sĩ phụ trách'
                : 'Xem danh sách phiếu chỉ định'}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'create' | 'prescriptions')}>
        <TabsList className="mb-6">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tạo phiếu chỉ định
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Danh sách phiếu chỉ định
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">

      {/* Patient Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-blue-600" />
            Chọn hồ sơ bệnh nhân
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Tìm hồ sơ bệnh nhân *</Label>
            <PatientSearch
              compact
              selectedPatientProfile={selectedPatientProfile}
              onPatientProfileSelect={(profile) => setSelectedPatientProfile(profile)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info & Selected Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Thông tin bệnh nhân
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPatientProfile ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium text-gray-700">Tên bệnh nhân</Label>
                    <p className="text-gray-900">{selectedPatientProfile.name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="font-medium text-gray-700">Mã hồ sơ</Label>
                    <p className="text-gray-900">{selectedPatientProfile.profileCode || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có dữ liệu. Vui lòng chọn hồ sơ bệnh nhân.</p>
              )}
            </CardContent>
          </Card>

          {/* Selected Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-green-600" />
                Dịch vụ đã chọn ({selectedServices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedServices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa có dịch vụ nào được chọn</p>
                  <p className="text-sm">Sử dụng ô tìm kiếm bên phải để thêm dịch vụ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedServices.map((service) => {
                    const doctors = service.serviceId ? doctorsByService[service.serviceId] || [] : [];
                    const isLoadingDoctor = service.serviceId ? loadingDoctors[service.serviceId] : false;
                    
                    return (
                      <div
                        key={service.serviceCode}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                            <Badge variant="secondary" className="text-xs">
                              {service.order}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900">
                                {service.serviceName || service.serviceCode}
                              </p>
                              <p className="text-xs text-gray-600">{service.serviceCode}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(service.serviceCode)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Doctor Selection */}
                        {service.serviceId && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Label className="text-xs font-medium text-gray-700 mb-2 block">
                              Bác sĩ phụ trách (tùy chọn)
                            </Label>
                            {isLoadingDoctor ? (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Đang tải danh sách bác sĩ...
                              </div>
                            ) : doctors.length > 0 ? (
                              <Select
                                value={service.doctorId || '__none__'}
                                onValueChange={(val) => {
                                  // Convert special value to undefined
                                  const doctorId = val === '__none__' ? undefined : val;
                                  updateServiceDoctor(service.serviceCode, doctorId);
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Chọn bác sĩ (tùy chọn)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">Không chọn</SelectItem>
                                  {doctors.map((doctor) => (
                                    <SelectItem key={doctor.doctorId} value={doctor.doctorId}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{doctor.doctorName}</span>
                                        <span className="text-xs text-gray-500">
                                          {doctor.doctorCode}
                                          {doctor.clinicRoomName && ` • ${doctor.clinicRoomName}`}
                                          {doctor.boothName && ` • ${doctor.boothName}`}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-xs text-gray-500">Không có bác sĩ khả dụng cho dịch vụ này</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Service Search */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-purple-600" />
                Tìm kiếm dịch vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isSearching && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Đang tìm kiếm...</p>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((service) => (
                    <div
                      key={service.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => addService(service)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {service.serviceCode}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{service.name}</h4>
                      {service.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{service.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Không tìm thấy dịch vụ nào</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleCreatePrescription}
                disabled={isCreating || !selectedPatientProfile || selectedServices.length === 0}
                className="w-full bg_GREEN-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Tạo phiếu chỉ định
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <List className="h-5 w-5 text-blue-600" />
                  Danh sách phiếu chỉ định
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPrescriptions()}
                  disabled={loadingPrescriptions}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingPrescriptions ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPrescriptions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Đang tải...</span>
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Không có phiếu chỉ định nào</p>
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Mã</TableHead>
                          <TableHead>Bệnh nhân</TableHead>
                          <TableHead className="w-[180px]">Bác sĩ</TableHead>
                          <TableHead className="w-[220px]">Dịch vụ</TableHead>
                          <TableHead className="w-[160px]">Mã bệnh án</TableHead>
                          <TableHead className="w-[120px]">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescriptions.map((p) => {
                          const displayCode = p.id?.slice(0, 8);
                          const patientName = p.patientProfile?.name || '-';
                          const doctorName = p.doctor?.auth?.name || '-';
                          const created = p.medicalRecord?.medicalRecordCode  || '-';
                          const servicesText = (p.services || [])
                            .map(s => s.service?.serviceCode || s.service?.name)
                            .filter(Boolean)
                            .join(', ');
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono text-xs">{displayCode}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{patientName}</div>
                                  <div className="text-xs text-gray-500">{p.patientProfile?.profileCode}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{doctorName}</TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-700 line-clamp-2">{servicesText || '-'}</div>
                              </TableCell>
                              <TableCell className="text-sm">{created}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {p.status || 'N/A'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Hiển thị {(prescriptionsPage - 1) * prescriptionsLimit + 1} - {Math.min(prescriptionsPage * prescriptionsLimit, prescriptionsTotal)} / {prescriptionsTotal}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrescriptionsPage(prev => Math.max(1, prev - 1))}
                        disabled={prescriptionsPage <= 1 || loadingPrescriptions}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm text-gray-600">
                        Trang {prescriptionsPage} / {prescriptionsTotalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrescriptionsPage(prev => Math.min(prescriptionsTotalPages, prev + 1))}
                        disabled={prescriptionsPage >= prescriptionsTotalPages || loadingPrescriptions}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


