'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cashierApi } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { Clipboard, CreditCard, FileSearch, Printer, QrCode, Scan } from 'lucide-react';

enum PrescriptionStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  SERVING = 'SERVING',
  WAITING_RESULT = 'WAITING_RESULT',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED'
}

type Service = {
  serviceId: string;
  serviceCode: string;
  name: string;
  price: number;
  description?: string | null;
  status: PrescriptionStatus;
  order?: number;
};

type LoadedPrescription = {
  id: string;
  prescriptionCode: string;
  status: string;
  services: Array<{
    prescriptionId: string;
    serviceId: string;
    status: PrescriptionStatus;
    results: any[];
    order: number;
    note?: string | null;
    service: {
      id: string;
      serviceCode: string;
      name: string;
      price: number;
      description?: string | null;
      timePerPatient: number;
    }
  }>;
  patientProfile: { name: string };
  doctor?: { id: string; doctorCode: string };
};

type PreviewResponse = {
  totalAmount: number;
  selectedServices: Service[];
  patientName: string;
  prescriptionDetails: LoadedPrescription;
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState<LoadedPrescription | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<{ invoiceCode: string; totalAmount: number } | null>(null);
  const [confirmResult, setConfirmResult] = useState<
    | null
    | {
        invoiceCode: string;
        totalAmount: number;
        paymentStatus: string;
        invoiceDetails: { serviceCode: string; serviceName: string; price: number }[];
        patientInfo?: { name?: string; dateOfBirth?: string; gender?: string } | null;
        routingAssignments?: {
          roomId: string;
          roomCode: string;
          roomName: string;
          boothId: string;
          boothCode: string;
          boothName: string;
          doctorId: string;
          doctorCode: string;
          doctorName: string;
        }[];
        prescriptionInfo?: { prescriptionCode: string; status: string; doctorName?: string };
      }
  >(null);
  const [printMode, setPrintMode] = useState<'none' | 'invoice' | 'routing'>('none');
  const [customerMoney, setCustomerMoney] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [transactionHistory, setTransactionHistory] = useState<Array<{
    invoiceCode: string;
    amount: number;
    time: Date;
    patientName: string;
  }>>([]);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update current time every second to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };

    // Set initial time
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const exportSectionAsPdf = useCallback(async (type: 'invoice' | 'routing', data?: any) => {
    const pdfData = data || confirmResult;
    if (!pdfData) return;

    // Helper function to get practitioner display info
    const getPractitionerDisplay = (assignment: any) => {
      if (assignment.doctorId && assignment.doctorName !== 'N/A') {
        return {
          label: 'Bác sĩ',
          name: assignment.doctorName,
          code: assignment.doctorCode
        };
      } else if (assignment.technicianId && assignment.technicianName !== 'N/A') {
        return {
          label: 'Kỹ thuật viên',
          name: assignment.technicianName,
          code: assignment.technicianCode
        };
      }
      return {
        label: 'Người thực hiện',
        name: 'N/A',
        code: 'N/A'
      };
    };

    try {
      const { default: pdfMake } = await import('pdfmake/build/pdfmake');
      const { default: pdfFonts } = await import('pdfmake/build/vfs_fonts');

      // Initialize pdfMake with default fonts
      pdfMake.vfs = pdfFonts.vfs;

      if (type === 'invoice') {
        // Create invoice content using pdfMake
        const invoiceContent = [
          // Header
          {
            text: 'HÓA ĐƠN THANH TOÁN',
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: `Mã hóa đơn: ${pdfData.invoiceCode}`,
            fontSize: 10,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },

          // Patient Info
          {
            text: 'Thông tin bệnh nhân:',
            fontSize: 12,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          {
            text: `Tên: ${pdfData.patientInfo?.name || preview?.patientName || ''}`,
            fontSize: 11,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Ngày thanh toán: ${new Date().toLocaleDateString('vi-VN')}`,
            fontSize: 11,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Trạng thái: ${pdfData.paymentStatus}`,
            fontSize: 11,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Phương thức thanh toán: ${
              paymentMethod === 'CASH' ? 'Tiền mặt' :
              paymentMethod === 'CARD' ? 'Thẻ tín dụng' :
              'Chuyển khoản'
            }`,
            fontSize: 11,
            margin: [0, 0, 0, 20]
          },

          // Services Table
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Dịch vụ', style: 'tableHeader' },
                  { text: 'Giá', style: 'tableHeader', alignment: 'right' }
                ],
                ...pdfData.invoiceDetails?.map((item: any) => [
                  { text: item.serviceName, fontSize: 10 },
                  { text: `${item.price.toLocaleString()} đ`, fontSize: 10, alignment: 'right' }
                ]) || [],
                [
                  { text: 'TỔNG CỘNG:', bold: true, fontSize: 12 },
                  { text: `${pdfData.totalAmount.toLocaleString()} đ`, bold: true, fontSize: 12, alignment: 'right' }
                ]
              ]
            },
            margin: [0, 0, 0, 10]
          },

          // Payment Details
          {
            table: {
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Tiền khách đưa:', fontSize: 11 },
                  { text: `${parseInt(customerMoney || '0').toLocaleString()} đ`, fontSize: 11, alignment: 'right' }
                ],
                [
                  { text: 'Tiền thối lại:', fontSize: 11 },
                  { text: `${(parseInt(customerMoney || '0') - pdfData.totalAmount).toLocaleString()} đ`, fontSize: 11, alignment: 'right' }
                ]
              ]
            },
            margin: [0, 0, 0, 20]
          },

          // Footer
          {
            text: `Nhân viên thu ngân: ${user?.name || 'N/A'}`,
            alignment: 'left',
            fontSize: 9,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Thời gian thanh toán: ${new Date().toLocaleString('vi-VN')}`,
            alignment: 'left',
            fontSize: 9,
            margin: [0, 0, 0, 15]
          },
          {
            text: 'Cảm ơn quý khách đã sử dụng dịch vụ!',
            alignment: 'center',
            fontSize: 10,
            margin: [0, 0, 0, 5]
          },
          {
            text: 'Hẹn gặp lại quý khách lần sau.',
            alignment: 'center',
            fontSize: 10
          }
        ];

        // Create PDF document
        const docDefinition = {
          content: invoiceContent,
          styles: {
            tableHeader: {
              bold: true,
              fontSize: 11,
              alignment: 'left'
            }
          }
        };

        const pdfDoc = pdfMake.createPdf(docDefinition as any);
        pdfDoc.download(`Hoa-don-${pdfData.invoiceCode}.pdf`);

      } else if (type === 'routing') {
        // Create routing guide content using pdfMake
        const routingContent = [
          // Header
          {
            text: 'PHIẾU HƯỚNG DẪN',
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: `Mã phiếu: ${pdfData.prescriptionInfo?.prescriptionCode || prescription?.prescriptionCode}`,
            fontSize: 10,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },

          // Patient Info
          {
            text: 'Thông tin bệnh nhân:',
            fontSize: 12,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          {
            text: `Tên: ${pdfData.patientInfo?.name || preview?.patientName || ''}`,
            fontSize: 11,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`,
            fontSize: 11,
            margin: [0, 0, 0, 5]
          },
          ...(pdfData.prescriptionInfo?.doctorName ? [{
            text: `Bác sĩ: ${pdfData.prescriptionInfo.doctorName}`,
            fontSize: 11,
            margin: [0, 0, 0, 20]
          }] : []),

          // Routing Assignments
          {
            text: 'HƯỚNG DẪN ĐẾN PHÒNG KHÁM',
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 15]
          },

          // Room assignments - Sort by service order before mapping
          ...(pdfData.routingAssignments?.length ? (() => {
            // Debug logging
            console.log('PDF Export - Invoice Details:', pdfData.invoiceDetails);
            console.log('PDF Export - Routing Assignments:', pdfData.routingAssignments);

            return pdfData.routingAssignments.sort((a: any, b: any) => {
              // Create mapping of service codes to order
              const serviceOrderMap: { [key: string]: number } = {};

              // Get order from invoice details (most reliable source)
              if (pdfData.invoiceDetails) {
                pdfData.invoiceDetails.forEach((detail: any, index: number) => {
                  serviceOrderMap[detail.serviceCode] = index + 1;
                  console.log(`Service ${detail.serviceCode} -> Order ${index + 1}`);
                });
              }

              // Function to get service order for an assignment
              const getServiceOrder = (assignment: any) => {
                const roomPrefix = assignment.roomCode?.split('-')[0]; // e.g., "HUY" from "HUY-1403"
                console.log(`Assignment ${assignment.roomName} (${assignment.roomCode}) -> Room Prefix: ${roomPrefix}`);

                // Direct mapping based on service codes and room types
                if (roomPrefix === 'CHU' && serviceOrderMap['XRAY_CHEST']) {
                  console.log(`Matched CHU room with XRAY_CHEST, order: ${serviceOrderMap['XRAY_CHEST']}`);
                  return serviceOrderMap['XRAY_CHEST'];
                }
                if (roomPrefix === 'HUY' && serviceOrderMap['CBC_TEST']) {
                  console.log(`Matched HUY room with CBC_TEST, order: ${serviceOrderMap['CBC_TEST']}`);
                  return serviceOrderMap['CBC_TEST'];
                }

                // Fallback: Try to find any service that matches room type
                for (const [serviceCode, order] of Object.entries(serviceOrderMap)) {
                  if (roomPrefix === 'CHU' && (serviceCode.includes('XRAY') || serviceCode.includes('CT') || serviceCode.includes('MRI'))) {
                    console.log(`Pattern matched ${serviceCode} with CHU room, order: ${order}`);
                    return order as number;
                  }
                  if (roomPrefix === 'HUY' && (serviceCode.includes('CBC') || serviceCode.includes('BLOOD'))) {
                    console.log(`Pattern matched ${serviceCode} with HUY room, order: ${order}`);
                    return order as number;
                  }
                }

                console.log(`No match found for ${assignment.roomName}, using default order 999`);
                return 999; // Default high order
              };

              const orderA = getServiceOrder(a);
              const orderB = getServiceOrder(b);

              console.log(`Comparing ${a.roomName} (order: ${orderA}) vs ${b.roomName} (order: ${orderB})`);
              return orderA - orderB;
            });
          })()
            .map((assignment: any, index: number) => {
            const practitioner = getPractitionerDisplay(assignment);
            return {
              stack: [
                {
                  text: `Phòng ${index + 1}: ${assignment.roomName} (${assignment.roomCode})`,
                  fontSize: 12,
                  bold: true,
                  margin: [0, 0, 0, 8]
                },
                {
                  text: `Buồng: ${assignment.boothName} (${assignment.boothCode})`,
                  fontSize: 11,
                  margin: [20, 0, 0, 5]
                },
                {
                  text: `${practitioner.label}: ${practitioner.name} (${practitioner.code})`,
                  fontSize: 11,
                  margin: [20, 0, 0, 15]
                }
              ]
            };
          }) : [{
            text: 'Không có hướng dẫn phòng khám nào.',
            fontSize: 11,
            italics: true
          }]),

          // Important Notes
          {
            text: 'Lưu ý quan trọng:',
            fontSize: 12,
            bold: true,
            margin: [0, 20, 0, 10]
          },
          {
            ul: [
              'Vui lòng đến phòng theo thứ tự được chỉ định',
              'Mang theo phiếu hướng dẫn này',
              'Tuân thủ hướng dẫn của nhân viên y tế'
            ],
            fontSize: 10,
            margin: [10, 0, 0, 20]
          },

          // Footer
          {
            text: 'Chúc quý khách mau chóng bình phục!',
            alignment: 'center',
            fontSize: 10
          }
        ];

        // Create PDF document
        const docDefinition = {
          content: routingContent
        };

        const pdfDoc = pdfMake.createPdf(docDefinition as any);
        pdfDoc.download(`Phieu-huong-dan-${pdfData.invoiceCode}.pdf`);
      }

      toast.success(`Đã xuất ${type === 'invoice' ? 'hóa đơn' : 'phiếu hướng dẫn'} thành công!`);
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(`Xuất PDF thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      // Fallback: suggest using print function
      toast.info('Bạn có thể dùng nút "In" để lưu PDF thay thế');
    }
  }, [confirmResult]);

  const availableServices: Service[] = useMemo(() => {
    if (!prescription) return [];
    return prescription.services.map((s) => ({
      serviceId: s.service.id,
      serviceCode: s.service.serviceCode,
      name: s.service.name,
      price: s.service.price,
      description: s.service.description ?? undefined,
      status: s.status,
      order: s.order,
    })).sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order
  }, [prescription]);

  const getStatusDisplay = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.NOT_STARTED:
        return { text: 'Chưa bắt đầu', color: 'text-blue-600 bg-blue-50' };
      case PrescriptionStatus.PENDING:
        return { text: 'Chờ xử lý', color: 'text-yellow-600 bg-yellow-50' };
      case PrescriptionStatus.WAITING:
        return { text: 'Đang chờ', color: 'text-orange-600 bg-orange-50' };
      case PrescriptionStatus.SERVING:
        return { text: 'Đang thực hiện', color: 'text-purple-600 bg-purple-50' };
      case PrescriptionStatus.WAITING_RESULT:
        return { text: 'Chờ kết quả', color: 'text-cyan-600 bg-cyan-50' };
      case PrescriptionStatus.COMPLETED:
        return { text: 'Hoàn thành', color: 'text-green-600 bg-green-50' };
      case PrescriptionStatus.DELAYED:
        return { text: 'Trì hoãn', color: 'text-red-600 bg-red-50' };
      case PrescriptionStatus.CANCELLED:
        return { text: 'Đã hủy', color: 'text-gray-600 bg-gray-50' };
      default:
        return { text: 'Không xác định', color: 'text-gray-600 bg-gray-50' };
    }
  };

  const canSelectService = (status: PrescriptionStatus) => {
    return status === PrescriptionStatus.NOT_STARTED;
  };

  const totalSelected = useMemo(() => {
    if (!preview) return 0;
    return preview.totalAmount;
  }, [preview]);

  const onLookup = async () => {
    if (!prescriptionCode.trim()) {
      toast.error('Vui lòng nhập mã phiếu chỉ định');
      return;
    }
    setLoading(true);
    try {
      const { data } = await cashierApi.getPrescriptionByCode(prescriptionCode.trim());
      setPrescription(data);
      setSelectedCodes([]);
      setPreview(null);
      setCreatedInvoice(null);
      setConfirmResult(null);
      setCustomerMoney('');
      setPaymentMethod('CASH');
      toast.success('Đã tải phiếu chỉ định');
    } catch (err: any) {
      toast.error(err.message || 'Không tìm thấy phiếu chỉ định');
      setPrescription(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = useCallback((serviceCode: string) => {
    setSelectedCodes((prev) =>
      prev.includes(serviceCode) ? prev.filter((c) => c !== serviceCode) : [...prev, serviceCode]
    );
  }, []);

  // Auto preview whenever selected services change
  useEffect(() => {
    if (!prescription) {
      setPreview(null);
      return;
    }
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    // Small debounce to avoid flooding while clicking fast
    previewTimerRef.current = setTimeout(async () => {
      if (selectedCodes.length === 0) {
        setPreview(null);
        return;
      }
      try {
        setPreviewLoading(true);
        const { data } = await cashierApi.previewInvoice({
          prescriptionCode: prescription.prescriptionCode,
          paymentMethod: 'CASH',
          selectedServiceCodes: selectedCodes,
        });
        setPreview(data);
      } catch (err: any) {
        toast.error(err.message || 'Không thể xem trước hoá đơn');
      } finally {
        setPreviewLoading(false);
      }
    }, 250);

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [prescription, selectedCodes]);

  // Remove onPreview function as it's now automatic
  const onPreview = async () => {}; // Keep for compatibility but do nothing

  const onPayment = useCallback(async () => {
    console.log('onPayment called with:', {
      prescription: !!prescription,
      user: !!user,
      customerMoney,
      totalSelected,
      selectedCodes: selectedCodes.length,
      paymentMethod
    });

    if (!prescription || !user || !customerMoney || parseInt(customerMoney) < totalSelected) {
      console.log('Payment validation failed');
      return;
    }

    setCreating(true);
    try {
      console.log('Creating invoice draft...');
      // Tạo invoice draft
      const { data: draftData } = await cashierApi.createInvoiceDraft({
        prescriptionCode: prescription.prescriptionCode,
        paymentMethod: paymentMethod,
        cashierId: user.id,
        selectedServiceCodes: selectedCodes,
      });
      console.log('Draft created:', draftData);

      console.log('Confirming payment...');
      // Xác nhận thanh toán ngay lập tức
      const { data: confirmData } = await cashierApi.confirmPayment({
        invoiceCode: draftData.invoiceCode,
        cashierId: user.id,
      });
      console.log('Payment confirmed:', confirmData);

      setCreatedInvoice({ invoiceCode: confirmData.invoiceCode, totalAmount: confirmData.totalAmount });
      setConfirmResult(confirmData);

      // Add to transaction history
      setTransactionHistory(prev => [{
        invoiceCode: confirmData.invoiceCode,
        amount: confirmData.totalAmount,
        time: new Date(),
        patientName: confirmData.patientInfo?.name || ''
      }, ...prev.slice(0, 9)]); // Keep only last 10 transactions

      // Auto export PDFs using the dedicated function
      setTimeout(() => {
        exportSectionAsPdf('invoice', confirmData);
        if (confirmData.routingAssignments?.length) {
          setTimeout(() => {
            exportSectionAsPdf('routing', confirmData);
          }, 1000); // Delay routing export to avoid conflicts
        }
      }, 200);

      toast.success(`Thanh toán thành công! ${confirmData.routingAssignments?.length ? 'Đã xuất hóa đơn và phiếu hướng dẫn.' : 'Đã xuất hóa đơn.'}`);

      // Reload trang sau 4 giây để reset về trạng thái ban đầu (đủ thời gian export PDF)
      setTimeout(() => {
        window.location.reload();
      }, 4000);

    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err.message || 'Thanh toán thất bại');
    } finally {
      console.log('Payment process finished');
      setCreating(false);
    }
  }, [prescription, user, customerMoney, totalSelected, selectedCodes, paymentMethod]);

  const onConfirm = useCallback(async () => {
    if (!createdInvoice || !user) return;
    setConfirming(true);
    try {
      const { data } = await cashierApi.confirmPayment({
        invoiceCode: createdInvoice.invoiceCode,
        cashierId: user.id,
      });
      toast.success('Thanh toán thành công');
      setConfirmResult(data);
      // Auto export PDFs after payment success
      setTimeout(() => {
        exportSectionAsPdf('invoice', data);
        if (data.routingAssignments?.length) {
          setTimeout(() => {
            exportSectionAsPdf('routing', data);
          }, 1000); // Delay routing export to avoid conflicts
        }
      }, 200);

      // Reload trang sau 4 giây để reset về trạng thái ban đầu (đủ thời gian export PDF)
      setTimeout(() => {
        window.location.reload();
      }, 4000);

    } catch (err: any) {
      toast.error(err.message || 'Không thể xác nhận thanh toán');
    } finally {
      setConfirming(false);
    }
  }, []);

  const handlePrint = (mode: 'invoice' | 'routing') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setPrintMode('none');
    }, 50);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Thanh toán dịch vụ</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {currentTime}
          </div>

          {transactionHistory.length > 0 && (
            <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <div className="text-sm text-green-800">
                <span className="font-medium">Doanh thu hôm nay:</span>
                <span className="font-semibold ml-2 text-green-600">
                  {transactionHistory.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} đ
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scan className="h-5 w-5 text-primary" />
            Tra cứu phiếu chỉ định
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="prescriptionCode">Mã phiếu chỉ định</Label>
              <Input
                id="prescriptionCode"
                placeholder="VD: PR-1756431212787-AIGAQI"
                value={prescriptionCode}
                onChange={(e) => setPrescriptionCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onLookup()}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onLookup} disabled={loading}>
                <FileSearch className="h-4 w-4 mr-2" /> Tra cứu
              </Button>
              <Button variant="secondary" disabled>
                <QrCode className="h-4 w-4 mr-2" /> Quét mã
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin phiếu chỉ định</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {prescription ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Mã: {prescription.prescriptionCode}</Badge>
                  </div>
                  <div>Bác sĩ: {prescription.doctor?.doctorCode || 'N/A'}</div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clipboard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa tra cứu phiếu chỉ định</p>
                  <p className="text-sm">Vui lòng nhập mã phiếu và tra cứu</p>
                </div>
              )}
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chọn dịch vụ thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableServices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clipboard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Chưa có dịch vụ nào</p>
                    <p className="text-sm">Vui lòng tra cứu phiếu chỉ định trước</p>
                  </div>
                ) : (
                  availableServices.map((s) => {
                    const checked = selectedCodes.includes(s.serviceCode);
                    const statusInfo = getStatusDisplay(s.status);
                    const canSelect = canSelectService(s.status);

                    return (
                      <div key={s.serviceCode} className="flex items-center justify-between border rounded-md p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-sm">{s.name}</div>
                            <Badge variant="secondary" className={`text-xs ${statusInfo.color}`}>
                              {statusInfo.text}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{s.serviceCode}</div>
                          {s.order && (
                            <div className="text-xs text-muted-foreground">Thứ tự: {s.order}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-semibold">{s.price?.toLocaleString()} đ</div>
                          {canSelect ? (
                            <Button
                              variant={checked ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleSelect(s.serviceCode)}
                            >
                              {checked ? 'Bỏ chọn' : 'Chọn'}
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" disabled>
                              {statusInfo.text}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">Số dịch vụ đã chọn: {selectedCodes.length}</div>
                <Separator />
                <div className="text-sm flex items-center justify-between">
                  <span>Tổng tiền:</span>
                  <span className="font-semibold text-lg">{previewLoading ? '...' : totalSelected.toLocaleString() + ' đ'}</span>
                </div>

              {selectedCodes.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-sm">Chưa chọn dịch vụ nào</div>
                </div>
              ) : (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label htmlFor="customer-money">Tiền khách đưa</Label>
                      <div className="flex gap-2">
                        <Input
                          id="customer-money"
                          type="number"
                          placeholder="Nhập số tiền khách đưa..."
                          value={customerMoney}
                          onChange={(e) => setCustomerMoney(e.target.value)}
                          className="text-lg flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setCustomerMoney(totalSelected.toString())}
                          className="px-3"
                        >
                          Đủ
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000].map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const current = parseInt(customerMoney) || 0;
                              setCustomerMoney((current + amount).toString());
                            }}
                          >
                            +{amount.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Phương thức thanh toán</Label>
                      <div className="flex gap-2">
                        {[
                          { value: 'CASH', label: '💵 Tiền mặt', color: 'bg-green-100 text-green-800' },
                          { value: 'CARD', label: '💳 Thẻ', color: 'bg-blue-100 text-blue-800' },
                          { value: 'TRANSFER', label: '🏦 Chuyển khoản', color: 'bg-purple-100 text-purple-800' }
                        ].map(method => (
                          <Button
                            key={method.value}
                            variant={paymentMethod === method.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod(method.value as any)}
                            className={paymentMethod === method.value ? method.color : ''}
                          >
                            {method.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {customerMoney && parseInt(customerMoney) >= totalSelected && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-sm flex items-center justify-between">
                          <span>Tiền thối lại:</span>
                          <span className="font-semibold text-green-600 text-lg">
                            {(parseInt(customerMoney) - totalSelected).toLocaleString()} đ
                          </span>
                        </div>
                      </div>
                    )}

                    {customerMoney && parseInt(customerMoney) < totalSelected && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="text-sm text-red-600">
                          Thiếu {(totalSelected - parseInt(customerMoney)).toLocaleString()} đ
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={onPayment}
                      disabled={!customerMoney || parseInt(customerMoney) < totalSelected || creating}
                    >
                      {creating ? 'Đang xử lý...' : 'Thanh toán'}
                    </Button>
                  </>
                )}

                {createdInvoice && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 space-y-2">
                    <div className="text-sm text-blue-800 flex items-center justify-between">
                      <span>✅ Thanh toán thành công!</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPrescription(null);
                          setSelectedCodes([]);
                          setPreview(null);
                          setCreatedInvoice(null);
                          setConfirmResult(null);
                          setCustomerMoney('');
                          setPrescriptionCode('');
                          setPaymentMethod('CASH');
                        }}
                      >
                        Giao dịch mới
                      </Button>
                    </div>
                    <div className="text-xs text-blue-600">
                      Mã hóa đơn: {createdInvoice?.invoiceCode}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {preview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chi tiết xem trước</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {preview?.selectedServices.map((s) => (
                    <div key={s.serviceCode} className="flex items-center justify-between">
                      <span>{s.name}</span>
                      <span>{s.price.toLocaleString()} đ</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Tổng</span>
                    <span>{preview?.totalAmount.toLocaleString()} đ</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {createdInvoice && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hoá đơn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>Mã hoá đơn: <span className="font-semibold">{createdInvoice?.invoiceCode}</span></div>
                  <div>Tổng tiền: <span className="font-semibold">{createdInvoice?.totalAmount.toLocaleString()} đ</span></div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button className="w-full" variant="outline" disabled={!confirmResult} onClick={() => handlePrint('invoice')}>
                      <Printer className="h-4 w-4 mr-2" /> In hoá đơn
                    </Button>
                    <Button className="w-full" variant="outline" disabled={!confirmResult?.routingAssignments?.length} onClick={() => handlePrint('routing')}>
                      <Printer className="h-4 w-4 mr-2" /> In phiếu hướng dẫn
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={!confirmResult}
                      onClick={() => exportSectionAsPdf('invoice')}
                    >
                      Tải PDF hoá đơn
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={!confirmResult?.routingAssignments?.length}
                      onClick={() => exportSectionAsPdf('routing')}
                    >
                      Tải PDF phiếu hướng dẫn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      {/* Printable sections */}
      {confirmResult && (
        <div className={printMode === 'invoice' ? '' : 'hidden print:block'}>
          <div id="print-invoice" data-print-scope className={printMode === 'invoice' ? 'block' : 'hidden'}>
            <h2 className="text-xl font-semibold mb-2">Hóa đơn thanh toán</h2>
            <div className="text-sm mb-2">Mã hoá đơn: {confirmResult?.invoiceCode}</div>
            <div className="text-sm mb-2">Trạng thái: {confirmResult?.paymentStatus}</div>
            <div className="text-sm mb-2">Bệnh nhân: {confirmResult?.patientInfo?.name || preview?.patientName || ''}</div>
            <Separator className="my-2" />
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Dịch vụ</th>
                  <th className="text-right">Giá</th>
                </tr>
              </thead>
              <tbody>
                {confirmResult?.invoiceDetails?.map((d) => (
                  <tr key={d.serviceCode}>
                    <td>{d.serviceName}</td>
                    <td className="text-right">{d.price.toLocaleString()} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Separator className="my-2" />
            <div className="text-right font-semibold">Tổng: {confirmResult?.totalAmount?.toLocaleString()} đ</div>
          </div>
        </div>
      )}

      {confirmResult?.routingAssignments && confirmResult.routingAssignments.length > 0 && (
        <div className={printMode === 'routing' ? '' : 'hidden print:block'}>
          <div id="print-routing" data-print-scope className={printMode === 'routing' ? 'block' : 'hidden'}>
            <h2 className="text-xl font-semibold mb-2">Phiếu hướng dẫn</h2>
            <div className="text-sm mb-2">Bệnh nhân: {confirmResult?.patientInfo?.name || preview?.patientName || ''}</div>
            <div className="text-sm mb-2">Phiếu: {confirmResult?.prescriptionInfo?.prescriptionCode || prescription?.prescriptionCode}</div>
            <Separator className="my-2" />
            <div className="space-y-2 text-sm">
              {confirmResult?.routingAssignments?.map((r) => {
                const getPractitionerInfo = (assignment: any) => {
                  if (assignment.doctorId && assignment.doctorName !== 'N/A') {
                    return { label: 'Bác sĩ', name: assignment.doctorName, code: assignment.doctorCode };
                  } else if (assignment.technicianId && assignment.technicianName !== 'N/A') {
                    return { label: 'Kỹ thuật viên', name: assignment.technicianName, code: assignment.technicianCode };
                  }
                  return { label: 'Người thực hiện', name: 'N/A', code: 'N/A' };
                };

                const practitioner = getPractitionerInfo(r);

                return (
                  <div key={r.boothId} className="border p-2 rounded">
                    <div><span className="font-medium">Phòng:</span> {r.roomName} ({r.roomCode})</div>
                    <div><span className="font-medium">Buồng:</span> {r.boothName} ({r.boothCode})</div>
                    <div><span className="font-medium">{practitioner.label}:</span> {practitioner.name} ({practitioner.code})</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {transactionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>📋 Lịch sử giao dịch hôm nay</span>
              <Badge variant="secondary">{transactionHistory.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transactionHistory.map((transaction, index) => (
                <div
                  key={transaction.invoiceCode}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{transaction.patientName}</div>
                      <div className="text-xs text-gray-500">
                        {transaction.invoiceCode} • {transaction.time.toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {transaction.amount.toLocaleString()} đ
                    </div>
                    <div className="text-xs text-gray-500">
                      {transaction.time.toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Tổng doanh thu hôm nay:</span>
              <span className="font-semibold text-green-600 text-lg">
                {transactionHistory.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} đ
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => setTransactionHistory([])}
            >
              Xóa lịch sử
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


