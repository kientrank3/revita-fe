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
  User
} from 'lucide-react';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { PatientSearch } from '@/components/medical-records/PatientSearch';
import { PatientProfile } from '@/lib/types/user';
import { MedicalRecord } from '@/lib/types/medical-record';

interface Service {
  id: string;
  serviceCode: string;
  name: string;
  description: string;
}

interface PrescriptionService {
  serviceCode: string;
  order: number;
}

interface PrescriptionData {
  patientProfileId: string;
  medicalRecordId: string;
  services: PrescriptionService[];
}

export default function ReceptionCreatePrescriptionPage() {
  const router = useRouter();

  // Patient selection and record listing
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Selected medical record
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedServices, setSelectedServices] = useState<PrescriptionService[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const loadMedicalRecordById = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const record = await medicalRecordService.getById(id);
      setMedicalRecord(record);
    } catch (error) {
      console.error('Error loading medical record:', error);
      toast.error('Không thể tải bệnh án');
      setMedicalRecord(null);
    }
  }, []);

  // Search services with debouncing
  useEffect(() => {
    const searchServices = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/services/search?query=${encodeURIComponent(searchQuery)}&limit=20`);
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

  // When patient profile changes, set selected patient id and reset data
  useEffect(() => {
    if (selectedPatientProfile?.id) {
      setSelectedPatientId(selectedPatientProfile.id);
      setMedicalRecord(null);
    } else {
      setSelectedPatientId('');
      setPatientRecords([]);
      setMedicalRecord(null);
    }
  }, [selectedPatientProfile]);

  // Load medical records for selected patient
  useEffect(() => {
    const loadRecords = async () => {
      if (!selectedPatientId) {
        setPatientRecords([]);
        return;
      }
      try {
        setLoadingRecords(true);
        const records = await medicalRecordService.getByPatientProfile(selectedPatientId);
        setPatientRecords(records);
        if (records.length > 0) {
          toast.success(`Đã tải ${records.length} bệnh án`);
        } else {
          toast.info('Hồ sơ này chưa có bệnh án');
        }
      } catch (e) {
        console.error('Load patient records error', e);
        setPatientRecords([]);
        toast.error('Không thể tải danh sách bệnh án');
      } finally {
        setLoadingRecords(false);
      }
    };
    loadRecords();
  }, [selectedPatientId]);

//   const refreshPatientRecords = useCallback(async () => {
//     if (!selectedPatientId) return;
//     try {
//       setLoadingRecords(true);
//       const records = await medicalRecordService.getByPatientProfile(selectedPatientId);
//       setPatientRecords(records);
//       toast.success(`Đã tải ${records.length} bệnh án`);
//     } catch (e) {
//       console.error('Refresh patient records error', e);
//       toast.error('Không thể tải danh sách bệnh án');
//     } finally {
//       setLoadingRecords(false);
//     }
//   }, [selectedPatientId]);

  const addService = useCallback((service: Service) => {
    const existingService = selectedServices.find(s => s.serviceCode === service.serviceCode);
    if (existingService) {
      toast.error('Dịch vụ này đã được thêm vào phiếu chỉ định');
      return;
    }

    const newService: PrescriptionService = {
      serviceCode: service.serviceCode,
      order: selectedServices.length + 1
    };

    setSelectedServices(prev => [...prev, newService]);
    setSearchQuery('');
    setSearchResults([]);
  }, [selectedServices]);

  const removeService = useCallback((serviceCode: string) => {
    setSelectedServices(prev => {
      const filtered = prev.filter(s => s.serviceCode !== serviceCode);
      return filtered.map((service, index) => ({ ...service, order: index + 1 }));
    });
  }, []);

  const handleCreatePrescription = async () => {
    if (!medicalRecord) {
      toast.error('Vui lòng tải bệnh án trước');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }

    setIsCreating(true);
    try {
      const prescriptionData: PrescriptionData = {
        patientProfileId: medicalRecord.patientProfileId,
        medicalRecordId: medicalRecord.id,
        services: selectedServices
      };

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(prescriptionData)
      });

      if (response.ok) {
        toast.success('Tạo phiếu chỉ định thành công');
        router.push(`/medical-records/${medicalRecord.id}`);
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

  const handleBack = () => {
    router.push('/medical-records');
  };

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
            Quay lại
          </Button>
          <div className="h-5 w-px bg-gray-300" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Tạo phiếu chỉ định (Lễ tân)</h1>
            <p className="text-sm text-gray-600">
              Nhập mã bệnh án, chọn dịch vụ và tạo phiếu
            </p>
          </div>
        </div>
      </div>

      {/* Patient and Medical Record Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-blue-600" />
            Chọn bệnh án theo hồ sơ bệnh nhân
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="gap-4">
            {/* Patient search (reused component) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Tìm hồ sơ bệnh nhân</Label>
              <PatientSearch
                compact
                selectedPatientProfile={selectedPatientProfile}
                onPatientProfileSelect={(profile) => setSelectedPatientProfile(profile)}
              />
            </div>

            {/* Patient's medical records */}
            <div className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Chọn bệnh án</Label>
                <Select
                  value={medicalRecord?.id || ''}
                  onValueChange={(val) => {
                    if (val) loadMedicalRecordById(val);
                  }}
                  disabled={!selectedPatientId || loadingRecords || patientRecords.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      !selectedPatientId
                        ? 'Vui lòng chọn hồ sơ bên trái'
                        : loadingRecords
                        ? 'Đang tải danh sách bệnh án...'
                        : patientRecords.length === 0
                        ? 'Hồ sơ này chưa có bệnh án'
                        : 'Chọn bệnh án'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {patientRecords.map((r) => {
                      const rec = r as unknown as { code?: string; medicalRecordCode?: string };
                      const recordCode = rec.code || rec.medicalRecordCode || `${r.id.slice(0, 8)}...`;
                      return (
                        <SelectItem key={r.id} value={r.id} >
                          <div className="flex items-center  justify-between gap-3">
                            
                              <div className="text-sm font-medium truncate">
                                {r.content?.diagnosis || r.content?.mainDiagnosis || 'Bệnh án'}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {new Date(r.createdAt).toLocaleString('vi-VN')} • Mã: {recordCode}
                              </div>
                            
                            {r.status && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {String(r.status)}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500">
                  {!selectedPatientId && 'Chưa chọn hồ sơ bệnh nhân'}
                  {selectedPatientId && loadingRecords && 'Đang tải bệnh án...'}
                  {selectedPatientId && !loadingRecords && patientRecords.length > 0 && `Tìm thấy ${patientRecords.length} bệnh án`}
                  {selectedPatientId && !loadingRecords && patientRecords.length === 0 && 'Hồ sơ này chưa có bệnh án'}
                </div>
              </div>
              {medicalRecord && (() => {
                const m = medicalRecord as unknown as { code?: string; medicalRecordCode?: string };
                const recordCode = m.code || m.medicalRecordCode || medicalRecord.id;
                return (
                  <div className="text-sm text-gray-600 mt-2">Đã chọn bệnh án: <strong>{recordCode}</strong></div>
                );
              })()}
            </div>
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
              {medicalRecord ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium text-gray-700">Tên bệnh nhân</Label>
                    <p className="text-gray-900">{medicalRecord.patientProfile?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="font-medium text-gray-700">Mã hồ sơ</Label>
                    <p className="text-gray-900">{medicalRecord.patientProfile?.profileCode || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có dữ liệu. Vui lòng tải bệnh án.</p>
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
                  {selectedServices.map((service, index) => (
                    <div
                      key={service.serviceCode}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 text-gray-500">
                        <GripVertical className="h-4 w-4 cursor-move" />
                        <Badge variant="secondary" className="text-xs">
                          {service.order}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{service.serviceCode}</p>
                        <p className="text-xs text-gray-600">Dịch vụ #{index + 1}</p>
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
                  ))}
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
                disabled={isCreating || !medicalRecord || selectedServices.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
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
    </div>
  );
}


