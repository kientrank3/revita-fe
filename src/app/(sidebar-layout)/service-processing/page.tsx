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
  User,
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
  GetMyServicesResponse
} from '@/lib/types/service-processing';
import { UpdateResultsDialog } from '@/components/service-processing/UpdateResultsDialog';

export default function ServiceProcessingPage() {
  const { user } = useAuth();
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [workSession, setWorkSession] = useState<WorkSession | null>(null);
  const [myServices, setMyServices] = useState<GetMyServicesResponse['data']['services']>([]);
  const [loadingMyServices, setLoadingMyServices] = useState(false);
  const [updatingService, setUpdatingService] = useState<string | null>(null);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<PrescriptionService | null>(null);

  // Load work session and my services on mount
  useEffect(() => {
    if (user?.id) {
      console.log('User authenticated:', user);
      console.log('Loading service processing data...');

      loadWorkSession();
      loadMyServices();
    }
  }, [user?.id]);

  const loadWorkSession = async () => {
    try {
      const response = await serviceProcessingService.getCurrentWorkSession();
      setWorkSession(response.data.workSession);
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
      setMyServices(response.data.services);
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
      setPrescription(response.data.prescription);
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
    prescriptionServiceId: string,
    newStatus: ServiceStatus,
    note?: string
  ) => {
    setUpdatingService(prescriptionServiceId);
    try {
      await serviceProcessingService.updateServiceStatus({
        prescriptionServiceId,
        status: newStatus,
        note
      });

      // Refresh prescription data if currently viewing one
      if (prescription) {
        const response = await serviceProcessingService.scanPrescription(prescription.prescriptionCode);
        setPrescription(response.data.prescription);
      }

      // Refresh my services list
      await loadMyServices();

      toast.success(`Cập nhật trạng thái thành công`);
    } catch (error: any) {
      console.error('Error updating service status:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdatingService(null);
    }
  };

  const handleQuickStart = async (prescriptionServiceId: string) => {
    await handleUpdateServiceStatus(prescriptionServiceId, 'SERVING', 'Bắt đầu thực hiện dịch vụ');
  };

  const handleQuickComplete = async (prescriptionServiceId: string) => {
    await handleUpdateServiceStatus(prescriptionServiceId, 'WAITING_RESULT', 'Hoàn thành dịch vụ');
  };

  const handleOpenResultsDialog = (service: PrescriptionService) => {
    setSelectedService(service);
    setResultsDialogOpen(true);
  };

  const handleResultsUpdate = () => {
    // Refresh data after results update
    if (prescription) {
      const response = serviceProcessingService.scanPrescription(prescription.prescriptionCode);
      response.then(data => setPrescription(data.data.prescription));
    }
    loadMyServices();
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

  const canUpdateStatus = (currentStatus: ServiceStatus, newStatus: ServiceStatus) => {
    const allowedTransitions: Record<ServiceStatus, ServiceStatus[]> = {
      'NOT_STARTED': ['PENDING', 'WAITING'],
      'PENDING': ['WAITING', 'SERVING', 'CANCELLED'],
      'WAITING': ['SERVING', 'CANCELLED'],
      'SERVING': ['WAITING_RESULT', 'COMPLETED', 'CANCELLED'],
      'WAITING_RESULT': ['COMPLETED', 'SERVING', 'CANCELLED'], // Can go back to SERVING for corrections
      'COMPLETED': [],
      'DELAYED': ['SERVING', 'CANCELLED'],
      'CANCELLED': []
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Xử lý dịch vụ</h1>
        </div>

        {workSession && (
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
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
                  key={service.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <Badge className={getStatusColor(service.status)}>
                        {getStatusText(service.status)}
                      </Badge>
                      <span className="text-sm text-gray-500">#{service.order}</span>
                    </div>
                    <div className="text-sm font-medium">
                      {service.service.price.toLocaleString()} đ
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">{service.service.name}</h4>
                    <p className="text-sm text-gray-600">{service.service.description}</p>
                    <p className="text-xs text-gray-500">{service.service.serviceCode}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    {service.status === 'WAITING' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickStart(service.id)}
                        disabled={updatingService === service.id}
                        className="flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Bắt đầu
                      </Button>
                    )}

                    {service.status === 'SERVING' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickComplete(service.id)}
                        disabled={updatingService === service.id}
                        className="flex items-center gap-1"
                      >
                        <Square className="h-3 w-3" />
                        Hoàn thành
                      </Button>
                    )}

                    {service.status === 'WAITING_RESULT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenResultsDialog(service)}
                        className="flex items-center gap-1"
                      >
                        <FileCheck className="h-3 w-3" />
                        Cập nhật kết quả
                      </Button>
                    )}
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
            <div className="space-y-4">
              {myServices.map((service) => (
                <div
                  key={service.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <Badge className={getStatusColor(service.status)}>
                        {getStatusText(service.status)}
                      </Badge>
                      <span className="text-sm text-gray-500">#{service.order}</span>
                    </div>
                    <div className="text-sm font-medium">
                      {service.service.price.toLocaleString()} đ
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <h4 className="font-medium">{service.service.name}</h4>
                    <p className="text-sm text-gray-600">{service.service.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{service.service.serviceCode}</span>
                      <span>•</span>
                      <span>{service.prescription.patientProfile.name}</span>
                      <span>•</span>
                      <span>{service.prescription.prescriptionCode}</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    {service.status === 'WAITING' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickStart(service.id)}
                        disabled={updatingService === service.id}
                        className="flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        {updatingService === service.id ? 'Đang xử lý...' : 'Bắt đầu'}
                      </Button>
                    )}

                    {service.status === 'SERVING' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickComplete(service.id)}
                        disabled={updatingService === service.id}
                        className="flex items-center gap-1"
                      >
                        <Square className="h-3 w-3" />
                        {updatingService === service.id ? 'Đang xử lý...' : 'Hoàn thành'}
                      </Button>
                    )}

                    {service.status === 'WAITING_RESULT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenResultsDialog(service)}
                        className="flex items-center gap-1"
                      >
                        <FileCheck className="h-3 w-3" />
                        Cập nhật kết quả
                      </Button>
                    )}
                  </div>
                </div>
              ))}
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
