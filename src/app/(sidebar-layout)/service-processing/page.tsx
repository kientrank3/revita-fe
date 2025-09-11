/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ScanLine,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Square,
  FileCheck,
  Stethoscope,
  Users
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { serviceProcessingService } from '@/lib/services/service-processing.service';
import {
  Prescription,
  PrescriptionService,
  ServiceStatus,
  WorkSession,
  GetMyServicesResponse,
  ScanPrescriptionResponse,
  GetWorkSessionResponse
} from '@/lib/types/service-processing';
import { UpdateResultsDialog } from '@/components/service-processing/UpdateResultsDialog';

export default function ServiceProcessingPage() {
  const { user } = useAuth();
  const [prescriptionCode, setPrescriptionCode] = useState('');
  // const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [workSession, setWorkSession] = useState<WorkSession | null>(null);
  const [myServices, setMyServices] = useState<GetMyServicesResponse['services']>([]);
  const [loadingMyServices, setLoadingMyServices] = useState(false);
  const [updatingService, setUpdatingService] = useState<string | null>(null);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<PrescriptionService | null>(null);

  // Load work session and my services on mount
  useEffect(() => {
    if (user?.id) {
      console.log('User authenticated:', user);
      console.log('Loading service processing data...');

      // loadWorkSession(); // Backend chưa có endpoint này
      loadMyServices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadWorkSession = async () => {
    try {
      const response = await serviceProcessingService.getCurrentWorkSession();
      setWorkSession(response.workSession);
    } catch (error: any) {
      console.error('Error loading work session:', error);
      if (error.response?.status === 404) {
        console.warn('Work session API not implemented on backend yet');
      }
      // Don't show error toast for work session, it's optional
    }
  };

  const loadMyServices = async () => {
    setLoadingMyServices(true);
    try {
      const response = await serviceProcessingService.getMyServices({
        limit: 50,
        offset: 0
      });
      console.log('My services response:', response);
      console.log('Response services:', response.services);
      
      if (response && response.services) {
        setMyServices(response.services);
      } else {
        console.error('Invalid response structure:', response);
        toast.error('Dữ liệu trả về không đúng định dạng');
      }
    } catch (error: any) {
      console.error('Error loading my services:', error);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách dịch vụ của bạn');
    } finally {
      setLoadingMyServices(false);
    }
  };

  const handleScanPrescription = async () => {
    if (!prescriptionCode.trim()) {
      toast.error('Vui lòng nhập mã phiếu chỉ định');
      return;
    }

    setScanning(true);
    try {
      const response = await serviceProcessingService.scanPrescription(prescriptionCode.trim());
      setPrescription(response.prescription);
      toast.success('Quét phiếu chỉ định thành công');
    } catch (error: any) {
      console.error('Error scanning prescription:', error);
      toast.error(error.response?.data?.message || 'Không thể quét phiếu chỉ định');
      setPrescription(null);
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateServiceStatus = async (
    prescriptionId: string,
    serviceId: string,
    newStatus: ServiceStatus,
    note?: string
  ) => {
    const serviceKey = getPrescriptionServiceId({ prescriptionId, serviceId });
    setUpdatingService(serviceKey);
    try {
      const response = await serviceProcessingService.updateServiceStatus({
        prescriptionId,
        serviceId,
        status: newStatus,
        note
      });

      console.log('🔄 Service status updated:', response);

      // Handle next service if exists (workflow progression)
      if (response.nextService) {
        console.log('➡️ Next service activated:', response.nextService);
        toast.info(`Service tiếp theo đã được kích hoạt: ${response.nextService.service.name}`);
      }

      // Refresh prescription data if currently viewing one
      if (prescription) {
        const scanResponse = await serviceProcessingService.scanPrescription(prescription.prescriptionCode);
        setPrescription(scanResponse.prescription);
      }

      // Refresh my services list
      await loadMyServices();

      toast.success(response.message || 'Cập nhật trạng thái thành công');
    } catch (error: any) {
      console.error('❌ Error updating service status:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdatingService(null);
    }
  };

  const handleQuickStart = async (patientOrServiceId: {
    patientId: string;
    patientName: string;
    prescriptionCode: string;
    services: typeof myServices;
  } | string) => {

    // Handle individual service start (from prescription details)
    if (typeof patientOrServiceId === 'string') {
      // For individual service, we need to get prescriptionId and serviceId from the string
      // The string format is "prescriptionId-serviceId"
      const [prescriptionId, serviceId] = patientOrServiceId.split('-');
      const serviceKey = patientOrServiceId; // Keep the combined key for UI state

      setUpdatingService(serviceKey);
      try {
        console.log('▶️ Quick starting individual service:', { prescriptionId, serviceId });
        const response = await serviceProcessingService.startService(prescriptionId, serviceId);

        console.log('✅ Individual service started successfully:', response);

        // Handle next service if exists
        if (response.nextService) {
          console.log('➡️ Next service activated:', response.nextService);
          toast.info(`Service tiếp theo đã được kích hoạt: ${response.nextService.service.name}`);
        }

        // Refresh data
        if (prescription) {
          const scanResponse = await serviceProcessingService.scanPrescription(prescription.prescriptionCode);
          setPrescription(scanResponse.prescription);
        }
        await loadMyServices();

        toast.success(response.message || 'Bắt đầu dịch vụ thành công');
      } catch (error: any) {
        console.error('❌ Error starting individual service:', error);
        toast.error(error.response?.data?.message || 'Không thể bắt đầu dịch vụ');
      } finally {
        setUpdatingService(null);
      }
      return;
    }

    // Handle patient batch start (from patient queue)
    const patient = patientOrServiceId;
    const waitingServices = patient.services.filter(s => s.status === 'WAITING');

    if (waitingServices.length === 0) {
      toast.warning('Không có dịch vụ nào đang chờ để bắt đầu');
      return;
    }

    console.log(`▶️ Starting ${waitingServices.length} services for patient: ${patient.patientName}`);

    // Set updating state for all services
    waitingServices.forEach(service => {
      setUpdatingService(getPrescriptionServiceId(service));
    });

    try {
      // Start all services concurrently
      const startPromises = waitingServices.map(async (service) => {
        console.log(`▶️ Starting service: ${service.service.name} (${service.prescriptionId}-${service.serviceId})`);
        return serviceProcessingService.startService(service.prescriptionId, service.serviceId);
      });

      const responses = await Promise.allSettled(startPromises);

      // Process results
      let successCount = 0;
      let errorCount = 0;

      responses.forEach((result, index) => {
        const service = waitingServices[index];
        if (result.status === 'fulfilled') {
          console.log(`✅ Service started: ${service.service.name}`, result.value);
          successCount++;

          // Handle next service if exists
          if (result.value.nextService) {
            console.log('➡️ Next service activated:', result.value.nextService);
          }
        } else {
          console.error(`❌ Failed to start service: ${service.service.name}`, result.reason);
          errorCount++;
        }
      });

      // Show appropriate message
      if (successCount > 0) {
        toast.success(`Đã bắt đầu ${successCount} dịch vụ thành công${errorCount > 0 ? ` (${errorCount} thất bại)` : ''}`);
      }

      if (errorCount > 0) {
        toast.error(`Không thể bắt đầu ${errorCount} dịch vụ`);
      }

      // Refresh data
      if (prescription) {
        const scanResponse = await serviceProcessingService.scanPrescription(prescription.prescriptionCode);
        setPrescription(scanResponse.prescription);
      }
      await loadMyServices();

    } catch (error: any) {
      console.error('❌ Error starting services:', error);
      toast.error(error.response?.data?.message || 'Không thể bắt đầu dịch vụ');
    } finally {
      // Clear updating state for all services
      waitingServices.forEach(service => {
        setUpdatingService(null);
      });
    }
  };

  // Helper function to get prescription service ID
  const getPrescriptionServiceId = (serviceOrIds: any): string => {
    // Handle object with prescriptionId and serviceId
    if (serviceOrIds.prescriptionId && serviceOrIds.serviceId) {
      return `${serviceOrIds.prescriptionId}-${serviceOrIds.serviceId}`;
    }

    // Handle service object from API
    if (serviceOrIds.prescriptionId && serviceOrIds.serviceId) {
      return `${serviceOrIds.prescriptionId}-${serviceOrIds.serviceId}`;
    }

    // Handle service object with id field
    if (serviceOrIds.id) return serviceOrIds.id;

    // Handle string (already combined)
    if (typeof serviceOrIds === 'string') return serviceOrIds;

    return 'unknown';
  };

  // Helper function to get available actions based on service status
  const getActionButtons = (status: ServiceStatus) => {
    switch(status) {
      case 'WAITING':
        return ['start'];
      case 'SERVING':
        return ['complete', 'complete']; // Chờ kết quả và hoàn thành trực tiếp
      case 'WAITING_RESULT':
        return ['uploadResults']; // Chỉ cập nhật kết quả
      case 'COMPLETED':
        return [];
      default:
        return [];
    }
  };

  // Handle service actions based on status
  const handleServiceAction = (service: any, action: string) => {
    const { prescriptionId, serviceId, status } = service;

    switch(action) {
      case 'start':
        if (status === 'WAITING') {
          const serviceIdCombined = getPrescriptionServiceId(service);
          handleQuickStart(serviceIdCombined);
        }
        break;

      case 'complete':
        if (status === 'SERVING') {
          console.log('⏳ Moving service to WAITING_RESULT:', { prescriptionId, serviceId });
          handleUpdateServiceStatus(prescriptionId, serviceId, 'WAITING_RESULT', 'Chờ kết quả');
        }
        break;

      case 'uploadResults':
        if (status === 'WAITING_RESULT' || status === 'SERVING') {
          console.log('🔍 Opening results dialog for service:', {
            prescriptionId,
            serviceId,
            status,
            action
          });
          handleOpenResultsDialog(service);
        }
        break;

      default:
        console.warn('Unknown action:', action);
    }
  };

  const handleQuickComplete = async (serviceOrId: any) => {
    let prescriptionId: string;
    let serviceId: string;
    let serviceKey: string;

    if (typeof serviceOrId === 'string') {
      // Legacy: parse from combined string
      const parts = serviceOrId.split('-');
      prescriptionId = parts.slice(0, 5).join('-');
      serviceId = parts.slice(5).join('-');
      serviceKey = serviceOrId;
    } else {
      // New: use direct IDs from service object
      prescriptionId = serviceOrId.prescriptionId;
      serviceId = serviceOrId.serviceId;
      serviceKey = getPrescriptionServiceId(serviceOrId);
    }

    setUpdatingService(serviceKey);
    try {
      console.log('⏳ Moving service to WAITING_RESULT:', { prescriptionId, serviceId });
      // Chuyển sang trạng thái chờ kết quả
      const response = await serviceProcessingService.completeService(prescriptionId, serviceId);

      console.log('🎯 Service moved to WAITING_RESULT successfully:', response);

      // Refresh data
      if (prescription) {
        const scanResponse = await serviceProcessingService.scanPrescription(prescription.prescriptionCode);
        setPrescription(scanResponse.prescription);
      }
      await loadMyServices();

      toast.success('Hoàn thành dịch vụ thành công');
    } catch (error: any) {
      console.error('❌ Error completing service:', error);
      toast.error(error.response?.data?.message || 'Không thể hoàn thành dịch vụ');
    } finally {
      // handleUpdateServiceStatus đã clear updating state
    }
  };

  const handleOpenResultsDialog = (service: PrescriptionService) => {
    setSelectedService(service);
    setResultsDialogOpen(true);
  };

  const handleResultsUpdate = async () => {
    try {
      console.log('📝 Updating service results...');
    // Refresh data after results update
    if (prescription) {
        const response = await serviceProcessingService.scanPrescription(prescription.prescriptionCode);
        setPrescription(response.prescription);
      }
      await loadMyServices();
      console.log('✅ Service results updated successfully');
    } catch (error: any) {
      console.error('❌ Error refreshing data after results update:', error);
    }
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'WAITING':
        return 'bg-orange-100 text-orange-800';
      case 'SERVING':
        return 'bg-purple-100 text-purple-800';
      case 'WAITING_RESULT':
        return 'bg-cyan-100 text-cyan-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DELAYED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'NOT_STARTED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ thực hiện';
      case 'WAITING':
        return 'Đang chờ phục vụ';
      case 'SERVING':
        return 'Đang thực hiện';
      case 'WAITING_RESULT':
        return 'Chờ kết quả';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'DELAYED':
        return 'Trì hoãn';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'NOT_STARTED':
        return 'Chưa bắt đầu';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'WAITING':
        return <Clock className="h-4 w-4" />;
      case 'SERVING':
        return <AlertCircle className="h-4 w-4" />;
      case 'WAITING_RESULT':
        return <Clock className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'DELAYED':
        return <AlertCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4" />;
      case 'NOT_STARTED':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Helper function to group services by patient
  const groupServicesByPatient = (services: typeof myServices) => {
    const patientMap = new Map();
    
    services.forEach(service => {
      const patientId = service.prescription.patientProfile.id;
      const patientName = service.prescription.patientProfile.name;
      const prescriptionCode = service.prescription.prescriptionCode;
      
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          patientId,
          patientName,
          prescriptionCode,
          services: []
        });
      }
      
      patientMap.get(patientId).services.push(service);
    });
    
    return Array.from(patientMap.values());
  };

  // Patient Service Card Component
  const PatientServiceCard = ({ 
    patient, 
    onQuickStart, 
    onQuickComplete, 
    onUpdateResults, 
    updatingService,
    isFirstInQueue = false
  }: {
    patient: {
      patientId: string;
      patientName: string;
      prescriptionCode: string;
      services: typeof myServices;
    };
    onQuickStart?: (patientOrServiceId: {
      patientId: string;
      patientName: string;
      prescriptionCode: string;
      services: typeof myServices;
    } | string) => void;
    onQuickComplete?: (serviceOrId: any) => void;
    onUpdateResults?: (service: any) => void;
    updatingService: string | null;
    isFirstInQueue?: boolean;
  }) => {
    const totalPrice = patient.services.reduce((sum, service) => sum + service.service.price, 0);
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
        {/* Patient Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold text-lg">{patient.patientName}</h4>
            <p className="text-sm text-gray-500">{patient.prescriptionCode}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{totalPrice.toLocaleString()} đ</div>
            <div className="text-xs text-gray-500">{patient.services.length} dịch vụ</div>
          </div>
        </div>

        {/* Service Actions - Individual service buttons */}
        <div className="space-y-2 mb-3">
          {patient.services.map((service) => {
            const serviceKey = getPrescriptionServiceId(service);
            console.log(`🔍 Service: ${service.service.name}, Status: ${service.status}, Key: ${serviceKey}`);
            return (
              <div key={serviceKey} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">#{service.order}</span>
                  <span className="font-medium text-sm">{service.service.name}</span>
        </div>

                {/* Individual Service Actions */}
                <div className="flex gap-2">

                  {service.status === 'SERVING' && (
                    <>
                      {/* Debug */}
                      {console.log(`🔍 SERVING Service: ${service.service.name}, onQuickComplete: ${!!onQuickComplete}, onUpdateResults: ${!!onUpdateResults}`)}

            <Button
              size="sm"
                        onClick={() => {
                          const { prescriptionId, serviceId } = service;
                          console.log('⏳ Updating status to WAITING_RESULT:', { prescriptionId, serviceId });
                          handleUpdateServiceStatus(prescriptionId, serviceId, 'WAITING_RESULT', 'Chờ kết quả');
                        }}
                        disabled={updatingService === serviceKey}
                        className="flex items-center gap-1 h-7 text-xs"
                      >
                        <Clock className="h-3 w-3" />
                        Chờ kết quả
            </Button>

            <Button
              size="sm"
                        variant="outline"
                        onClick={() => {
                          // Use direct IDs from service object
                          const { prescriptionId, serviceId } = service;
                          console.log('🔍 Direct IDs from service:', { prescriptionId, serviceId });
                          handleUpdateServiceStatus(prescriptionId, serviceId, 'COMPLETED', 'Hoàn thành dịch vụ');
                        }}
                        disabled={updatingService === serviceKey}
                        className="flex items-center gap-1 h-7 text-xs"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Hoàn thành
            </Button>
                    </>
          )}

                  {service.status === 'WAITING_RESULT' && onUpdateResults && (
            <Button
              size="sm"
              variant="outline"
                      onClick={() => {
                        console.log('🔍 Opening results dialog for WAITING_RESULT service:', {
                          prescriptionId: service.prescriptionId,
                          serviceId: service.serviceId,
                          status: service.status
                        });
                        onUpdateResults(service);
                      }}
                      className="flex items-center gap-1 h-7 text-xs"
            >
              <FileCheck className="h-3 w-3" />
              Cập nhật kết quả
            </Button>
          )}

        </div>
              </div>
            );
          })}
        </div>

        {/* Bulk Actions - Start Services */}
        {(() => {
          const waitingServices = patient.services.filter(s => s.status === 'WAITING');

          return (
            <div className="flex justify-center gap-4 pt-2 border-t border-gray-200">
              {waitingServices.length > 0 && onQuickStart && (
                <Button
                  size="sm"
                  onClick={() => {
                    console.log(`▶️ Starting ${waitingServices.length} WAITING services for patient: ${patient.patientName}`);
                    onQuickStart(patient);
                  }}
                  disabled={patient.services.some(s => updatingService === getPrescriptionServiceId(s))}
                  className="flex items-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  {patient.services.some(s => updatingService === getPrescriptionServiceId(s)) ? 'Đang xử lý...' : 'Bắt đầu'}
                </Button>
              )}
            </div>
          );
        })()}

      </div>
    );
  };

  // const canUpdateStatus = (currentStatus: ServiceStatus, newStatus: ServiceStatus) => {
  //   const allowedTransitions: Record<ServiceStatus, ServiceStatus[]> = {
  //     'NOT_STARTED': ['PENDING', 'WAITING'],
  //     'PENDING': ['WAITING', 'SERVING', 'CANCELLED'],
  //     'WAITING': ['SERVING', 'CANCELLED'],
  //     'SERVING': ['WAITING_RESULT', 'COMPLETED', 'CANCELLED'],
  //     'WAITING_RESULT': ['COMPLETED', 'SERVING', 'CANCELLED'], // Can go back to SERVING for corrections
  //     'COMPLETED': [],
  //     'DELAYED': ['SERVING', 'CANCELLED'],
  //     'CANCELLED': []
  //   };

  //   return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  // };

  return (
    <div className="container mx-auto px-8 py-6 space-y-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Xử lý dịch vụ</h1>
        </div>

        {workSession && (
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600">
              <div className="font-medium">Ca làm việc hiện tại:</div>
              <div>{workSession.booth.room.roomName} - {workSession.booth.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Work Session Info */}
      {workSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-green-600" />
              Thông tin ca làm việc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Phòng</div>
                <div className="font-medium">{workSession.booth.room.roomName}</div>
                <div className="text-sm text-gray-500">{workSession.booth.room.roomCode}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Buồng</div>
                <div className="font-medium">{workSession.booth.name}</div>
                <div className="text-sm text-gray-500">{workSession.booth.boothCode}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Thời gian</div>
                <div className="font-medium">
                  {new Date(workSession.startTime).toLocaleTimeString('vi-VN')} -
                  {new Date(workSession.endTime).toLocaleTimeString('vi-VN')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Prescription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanLine className="h-5 w-5 text-primary" />
            Quét phiếu chỉ định
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="prescriptionCode">Mã phiếu chỉ định</Label>
              <Input
                id="prescriptionCode"
                placeholder="VD: PR-1756995889229-26DUNT"
                value={prescriptionCode}
                onChange={(e) => setPrescriptionCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanPrescription()}
              />
            </div>
            <Button
              onClick={handleScanPrescription}
              disabled={scanning}
              className="flex items-center gap-2"
            >
              <ScanLine className="h-4 w-4" />
              {scanning ? 'Đang quét...' : 'Quét mã'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Prescription */}
      {prescription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-green-600" />
              Thông tin phiếu chỉ định
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prescription Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Mã phiếu</div>
                <div className="font-medium">{prescription.prescriptionCode}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Trạng thái</div>
                <Badge className={getStatusColor(prescription.status as ServiceStatus)}>
                  {getStatusText(prescription.status as ServiceStatus)}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-600">Bệnh nhân</div>
                <div className="font-medium">{prescription.patientProfile.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Bác sĩ</div>
                <div className="font-medium">{prescription.doctor.name}</div>
              </div>
            </div>

            <Separator />

            {/* Services List */}
            <div className="space-y-3">
              <h3 className="font-medium">Dịch vụ ({prescription.services.length})</h3>
              {prescription.services.map((service) => (
                <div
                  key={getPrescriptionServiceId(service)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Service Header with Status and Actions */}
                  <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <Badge className={getStatusColor(service.status)}>
                        {getStatusText(service.status)}
                      </Badge>
                      <span className="text-sm text-gray-500">#{service.order}</span>
                      <span className="font-medium">{service.service.name}</span>
                  </div>

                  {/* Action Buttons */}
                    <div className="flex gap-2">
                      {(() => {
                        const actions = getActionButtons(service.status);
                        return (
                          <>
                            {actions.includes('start') && (
                      <Button
                        size="sm"
                                onClick={() => {
                                  console.log('🔍 Service object:', service);
                                  console.log('🔍 Service ID:', service.id);
                                  console.log('🔍 Prescription ID:', service.prescriptionId);
                                  console.log('🔍 Service ID (nested):', service.serviceId);
                                  const serviceId = getPrescriptionServiceId(service);
                                  console.log('🔍 Generated Service ID:', serviceId);
                                  handleServiceAction(service, 'start');
                                }}
                                disabled={updatingService === getPrescriptionServiceId(service)}
                                className="flex items-center gap-1 h-8"
                      >
                        <Play className="h-3 w-3" />
                        Bắt đầu
                      </Button>
                    )}

                            {actions.includes('complete') && (
                      <Button
                        size="sm"
                                onClick={() => {
                                  const { prescriptionId, serviceId } = service;
                                  console.log('⏳ Updating status to WAITING_RESULT from prescription details:', { prescriptionId, serviceId });
                                  handleUpdateServiceStatus(prescriptionId, serviceId, 'WAITING_RESULT', 'Chờ kết quả');
                                }}
                                disabled={updatingService === getPrescriptionServiceId(service)}
                                className="flex items-center gap-1 h-8"
                              >
                                <Clock className="h-3 w-3" />
                                Chờ kết quả
                      </Button>
                    )}

                            {actions.includes('uploadResults') && (
                      <Button
                        size="sm"
                        variant="outline"
                                onClick={() => {
                                  console.log('🔍 Opening results dialog from prescription details:', {
                                    prescriptionId: service.prescriptionId,
                                    serviceId: service.serviceId,
                                    status: service.status
                                  });
                                  handleServiceAction(service, 'uploadResults');
                                }}
                                disabled={updatingService === getPrescriptionServiceId(service)}
                                className="flex items-center gap-1 h-8"
                      >
                        <FileCheck className="h-3 w-3" />
                        Cập nhật kết quả
                      </Button>
                    )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{service.service.description}</p>
                    <p className="text-xs text-gray-500">{service.service.serviceCode}</p>
                  </div>

                  {/* Results */}
                  {service.results && service.results.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h5 className="font-medium text-sm mb-2">Kết quả:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {service.results.map((result, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>{result}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Services Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-orange-600" />
            Hàng đợi dịch vụ của tôi ({myServices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMyServices ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
            </div>
          ) : myServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Chưa có dịch vụ nào được giao</p>
              <p className="text-xs mt-1">Dịch vụ sẽ xuất hiện khi được phân công</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Row 1: Đang phục vụ */}
              {(() => {
                const servingServices = myServices.filter(s => s.status === 'SERVING');
                const servingPatients = groupServicesByPatient(servingServices);
                
                return servingPatients.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Đang phục vụ
                    </h3>
                    <div className="grid gap-4">
                      {servingPatients.map((patient) => (
                        <PatientServiceCard
                          key={patient.patientId}
                          patient={patient}
                          onQuickComplete={handleQuickComplete}
                          onUpdateResults={handleOpenResultsDialog}
                          updatingService={updatingService}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Row 2: 2 cột - Đang chờ phục vụ và Chờ kết quả */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cột 1: Đang chờ phục vụ */}
                <div>
                  {(() => {
                    const waitingServices = myServices.filter(s => s.status === 'WAITING');
                    const waitingPatients = groupServicesByPatient(waitingServices);
                    
                    return (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          Đang chờ phục vụ
                        </h3>
                        {waitingPatients.length > 0 ? (
                          <div className="space-y-4">
                            {waitingPatients.map((patient, index) => (
                              <PatientServiceCard
                                key={patient.patientId}
                                patient={patient}
                                onQuickStart={handleQuickStart}
                                updatingService={updatingService}
                                isFirstInQueue={index === 0}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Không có bệnh nhân đang chờ</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Cột 2: Chờ kết quả */}
                <div>
                  {(() => {
                    const waitingResultServices = myServices.filter(s => s.status === 'WAITING_RESULT');
                    const waitingResultPatients = groupServicesByPatient(waitingResultServices);
                    
                    return (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          Chờ kết quả
                        </h3>
                        {waitingResultPatients.length > 0 ? (
                          <div className="space-y-4">
                            {waitingResultPatients.map((patient) => (
                              <PatientServiceCard
                                key={patient.patientId}
                                patient={patient}
                                onUpdateResults={handleOpenResultsDialog}
                                updatingService={updatingService}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Không có bệnh nhân chờ kết quả</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Results Dialog */}
      {selectedService && (
        <UpdateResultsDialog
          open={resultsDialogOpen}
          onOpenChange={setResultsDialogOpen}
          service={selectedService}
          onUpdate={handleResultsUpdate}
        />
      )}
    </div>
  );
}
