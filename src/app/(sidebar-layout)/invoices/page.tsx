'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as QRCode from 'qrcode';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cashierApi } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Clipboard, Copy, CreditCard, ExternalLink, FileSearch, Printer, QrCode, RefreshCcw, Scan, Timer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

type PaymentMethodType = 'CASH' | 'TRANSFER';

type RoutingAssignment = {
  roomId: string;
  roomCode: string;
  roomName: string;
  boothId: string | null;
  boothCode: string | null;
  boothName: string | null;
  doctorId: string | null;
  doctorCode: string | null;
  doctorName: string | null;
  technicianId?: string | null;
  technicianCode?: string | null;
  technicianName?: string | null;
};

type InvoiceDetail = {
  serviceId?: string;
  serviceCode: string;
  serviceName: string;
  price: number;
};

type PaymentTransaction = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  qrCode?: string | null;
  providerTransactionId?: string | null;
  orderCode: string;
  expiredAt?: string | null;
  paidAt?: string | null;
  isVerified?: boolean;
};

type InvoicePaymentSummary = {
  invoiceCode: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: PaymentMethodType | 'WALLET';
  invoiceDetails?: InvoiceDetail[];
  patientInfo?: { name?: string; dateOfBirth?: string; gender?: string } | null;
  routingAssignments?: RoutingAssignment[];
  prescriptionInfo?: { prescriptionCode: string; status: string; doctorName?: string };
  transaction?: PaymentTransaction | null;
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: 'Tiền mặt',
  CARD: 'Thẻ',
  TRANSFER: 'Chuyển khoản',
  WALLET: 'Ví điện tử',
};

const getPaymentStatusBadgeClass = (status?: string) => {
  switch (status) {
    case 'PAID':
    case 'SUCCEEDED':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState<LoadedPrescription | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<InvoicePaymentSummary | null>(null);
  const [confirmResult, setConfirmResult] = useState<InvoicePaymentSummary | null>(null);
  const [createdInvoiceQrImage, setCreatedInvoiceQrImage] = useState<string | null>(null);
  const [confirmedInvoiceQrImage, setConfirmedInvoiceQrImage] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<'none' | 'invoice' | 'routing' | 'payment'>('none');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [customerMoney, setCustomerMoney] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [transactionHistory, setTransactionHistory] = useState<Array<{
    invoiceCode: string;
    amount: number;
    time: Date;
    patientName: string;
  }>>([]);
  const [refreshingTransaction, setRefreshingTransaction] = useState(false);
  const [manualConfirming, setManualConfirming] = useState(false);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);
  const [socketLog, setSocketLog] = useState<string[]>([]);

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

  useEffect(() => {
    let canceled = false;
    const rawQrValue = createdInvoice?.transaction?.qrCode;
    const qrValue = typeof rawQrValue === 'string'
      ? rawQrValue.replace(/\s+/g, '').replace(/[^\x20-\x7E]/g, '').trim()
      : rawQrValue;

    if (!qrValue) {
      setCreatedInvoiceQrImage(null);
      return;
    }

    (async () => {
      try {
        const text = typeof qrValue === 'string' ? qrValue : String(qrValue);
        let dataUrl: string | null = null;
        try {
          dataUrl = await QRCode.toDataURL(text, { type: 'image/png', margin: 0, errorCorrectionLevel: 'M', width: 256 });
        } catch (err1) {
          // Fallback: use canvas API if available
          try {
            if (typeof document !== 'undefined') {
              const canvas = document.createElement('canvas');
              await new Promise<void>((resolve, reject) => {
                QRCode.toCanvas(canvas, text, { errorCorrectionLevel: 'M', margin: 0, width: 256 }, (e: any) => (e ? reject(e) : resolve()));
              });
              dataUrl = canvas.toDataURL('image/png');
            } else {
              throw err1;
            }
          } catch (err2) {
            console.error('[QR] Failed to generate createdInvoice QR', {
              errorPrimary: (err1 as Error)?.message,
              errorFallback: (err2 as Error)?.message,
              length: text?.length,
              preview: typeof text === 'string' ? `${text.slice(0, 20)}...${text.slice(-20)}` : 'n/a'
            });
            throw err2;
          }
        }
        if (!canceled) {
          setCreatedInvoiceQrImage(dataUrl);
        }
      } catch (error) {
        console.error('Failed to generate QR image:', error);
        if (!canceled) {
          setCreatedInvoiceQrImage(null);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [createdInvoice?.transaction?.qrCode]);

  useEffect(() => {
    let canceled = false;
    const rawQrValue = confirmResult?.transaction?.qrCode;
    const qrValue = typeof rawQrValue === 'string'
      ? rawQrValue.replace(/\s+/g, '').replace(/[^\x20-\x7E]/g, '').trim()
      : rawQrValue;

    if (!qrValue) {
      setConfirmedInvoiceQrImage(null);
      return;
    }

    (async () => {
      try {
        const text = typeof qrValue === 'string' ? qrValue : String(qrValue);
        let dataUrl: string | null = null;
        try {
          dataUrl = await QRCode.toDataURL(text, { type: 'image/png', margin: 0, errorCorrectionLevel: 'M', width: 256 });
        } catch (err1) {
          // Fallback: use canvas API if available
          try {
            if (typeof document !== 'undefined') {
              const canvas = document.createElement('canvas');
              await new Promise<void>((resolve, reject) => {
                QRCode.toCanvas(canvas, text, { errorCorrectionLevel: 'M', margin: 0, width: 256 }, (e: any) => (e ? reject(e) : resolve()));
              });
              dataUrl = canvas.toDataURL('image/png');
            } else {
              throw err1;
            }
          } catch (err2) {
            console.error('[QR] Failed to generate confirmedInvoice QR', {
              errorPrimary: (err1 as Error)?.message,
              errorFallback: (err2 as Error)?.message,
              length: text?.length,
              preview: typeof text === 'string' ? `${text.slice(0, 20)}...${text.slice(-20)}` : 'n/a'
            });
            throw err2;
          }
        }
        if (!canceled) {
          setConfirmedInvoiceQrImage(dataUrl);
        }
      } catch (error) {
        console.error('Failed to generate QR image for confirmed invoice:', error);
        if (!canceled) {
          setConfirmedInvoiceQrImage(null);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [confirmResult?.transaction?.qrCode]);

  const exportSectionAsPdf = useCallback(async (type: 'invoice' | 'routing', data?: any, customCustomerMoney?: number) => {
    const pdfData = data || confirmResult;
    if (!pdfData) return;
    
    // Use custom customer money if provided, otherwise use global state
    const customerMoneyValue = customCustomerMoney !== undefined ? customCustomerMoney : parseInt(customerMoney) || 0;

    const formatCurrency = (value?: number | null) => {
      if (typeof value !== 'number') return '';
      return value.toLocaleString('vi-VN');
    };

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
              paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'
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
                  { text: `${customerMoneyValue.toLocaleString()} đ`, fontSize: 11, alignment: 'right' }
                ],
                [
                  { text: 'Tiền thối lại:', fontSize: 11 },
                  { text: `${(customerMoneyValue - pdfData.totalAmount).toLocaleString()} đ`, fontSize: 11, alignment: 'right' }
                ]
              ]
            },
            margin: [0, 0, 0, 20]
          },

          // Transfer Payment QR
          ...(pdfData.transaction?.qrCode
            ? [
                {
                  text: 'Thông tin thanh toán chuyển khoản',
                  fontSize: 12,
                  bold: true,
                  margin: [0, 10, 0, 8]
                },
                {
                  columns: [
                    {
                      width: '*',
                      stack: [
                        {
                          text: 'Quý khách vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới:',
                          fontSize: 10,
                          margin: [0, 0, 0, 6]
                        },
                        {
                          text: `Số tiền: ${formatCurrency(pdfData.transaction?.amount ?? pdfData.totalAmount)} đ`,
                          fontSize: 10,
                          bold: true
                        },
                        ...(pdfData.transaction?.orderCode
                          ? [
                              {
                                text: `Mã đơn PayOS: ${pdfData.transaction.orderCode}`,
                                fontSize: 10,
                                margin: [0, 4, 0, 0]
                              }
                            ]
                          : []),
                        ...(pdfData.transaction?.providerTransactionId
                          ? [
                              {
                                text: `Mã giao dịch PayOS: ${pdfData.transaction.providerTransactionId}`,
                                fontSize: 10,
                                margin: [0, 4, 0, 0]
                              }
                            ]
                          : []),
                        ...(pdfData.transaction?.paymentUrl
                          ? [
                              {
                                text: pdfData.transaction.paymentUrl,
                                fontSize: 10,
                                color: '#1d4ed8',
                                link: pdfData.transaction.paymentUrl,
                                margin: [0, 6, 0, 0]
                              }
                            ]
                          : []),
                      ]
                    },
                    {
                      width: 'auto',
                      qr: pdfData.transaction.qrCode,
                      fit: 140,
                      alignment: 'center'
                    }
                  ],
                  columnGap: 12,
                  margin: [0, 0, 0, 15]
                }
              ]
            : []),

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
        pdfDoc.download(`Phieu-huong-dan-${pdfData.prescriptionInfo?.prescriptionCode || prescription?.prescriptionCode}.pdf`);
      }

      toast.success(`Đã xuất ${type === 'invoice' ? 'hóa đơn' : 'phiếu hướng dẫn'} thành công!`);
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(`Xuất PDF thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      // Fallback: suggest using print function
      toast.info('Bạn có thể dùng nút "In" để lưu PDF thay thế');
    }
  }, [confirmResult, paymentMethod, preview, user, prescription, customerMoney]);

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

  const isTransferPayment = paymentMethod === 'TRANSFER';
  const isCreatedInvoicePaid = createdInvoice ? ['PAID', 'SUCCEEDED'].includes(createdInvoice.paymentStatus ?? '') : false;
  const isCreatedInvoiceTransferPending = createdInvoice?.paymentMethod === 'TRANSFER' && !isCreatedInvoicePaid;

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
      setManualConfirming(false);
      setRefreshingTransaction(false);
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
          paymentMethod,
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
  }, [paymentMethod, prescription, selectedCodes]);

  // Remove onPreview function as it's now automatic
  const onPreview = async () => {}; // Keep for compatibility but do nothing

  const getPayosUrls = useCallback(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      returnUrl:
        process.env.NEXT_PUBLIC_PAYOS_RETURN_URL?.trim() ||
        (origin ? `${origin}/payments/transfer-success` : undefined),
      cancelUrl:
        process.env.NEXT_PUBLIC_PAYOS_CANCEL_URL?.trim() ||
        (origin ? `${origin}/payments/transfer-cancel` : undefined),
    };
  }, []);

  const formatDateTime = useCallback((value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN');
  }, []);

  const finalizePaidInvoice = useCallback((invoice: InvoicePaymentSummary) => {
    setCreatedInvoice(invoice);
    setConfirmResult(invoice);

    setTransactionHistory((prev) => [
      {
        invoiceCode: invoice.invoiceCode,
        amount: invoice.totalAmount,
        time: new Date(),
        patientName: invoice.patientInfo?.name || preview?.patientName || ''
      },
      ...prev.slice(0, 9)
    ]);

    const successMessage = invoice.routingAssignments?.length
      ? 'Thanh toán thành công! Đã xuất hóa đơn và phiếu hướng dẫn.'
      : 'Thanh toán thành công! Đã xuất hóa đơn.';

    toast.success(successMessage);

    setTimeout(() => {
      exportSectionAsPdf('invoice', invoice);
      if (invoice.routingAssignments?.length) {
        toast.info('Đang xuất phiếu hướng dẫn... Nếu không thấy tệp tải xuống, hãy bấm "Tải PDF phiếu hướng dẫn".');
        setTimeout(() => {
          exportSectionAsPdf('routing', invoice);
        }, 1500);
      }
    }, 200);

    setTimeout(() => {
      window.location.reload();
    }, 4000);
  }, [exportSectionAsPdf, preview]);

  const copyToClipboard = useCallback(async (content: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(successMessage);
    } catch (error) {
      console.error('Clipboard error:', error);
      toast.error('Không thể sao chép. Vui lòng thử lại.');
    }
  }, []);

  const onPayment = useCallback(async () => {
    if (!prescription || !user) {
      toast.error('Vui lòng tra cứu phiếu chỉ định trước khi thanh toán');
      return;
    }

    if (selectedCodes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ để thanh toán');
      return;
    }

    if (paymentMethod !== 'TRANSFER') {
      if (!customerMoney) {
        toast.error('Vui lòng nhập số tiền khách đưa');
        return;
      }
      const customerValue = parseInt(customerMoney, 10);
      if (Number.isNaN(customerValue) || customerValue < totalSelected) {
        toast.error('Số tiền khách đưa chưa đủ để thanh toán');
        return;
      }
    }

    setCreating(true);
    try {
      const basePayload = {
        prescriptionCode: prescription.prescriptionCode,
        paymentMethod,
        cashierId: user.id,
        selectedServiceCodes: selectedCodes,
      } as const;

      if (paymentMethod === 'TRANSFER') {
        const { returnUrl, cancelUrl } = getPayosUrls();

        const { data } = await cashierApi.createInvoiceDraft({
          ...basePayload,
          returnUrl,
          cancelUrl,
        });

        if (data.paymentStatus && ['PAID', 'SUCCEEDED'].includes(data.paymentStatus)) {
          finalizePaidInvoice(data);
          return;
        }

        setConfirmResult(null);
        setManualConfirming(false);
        setRefreshingTransaction(false);
        setCreatedInvoice(data);
        setPaymentModalOpen(true);

        if (!data.transaction?.paymentUrl) {
          toast.warning('Không nhận được liên kết thanh toán từ PayOS. Vui lòng thử lại hoặc chọn phương thức khác.');
        } else {
          toast.info('Đã tạo yêu cầu thanh toán chuyển khoản. Vui lòng hướng dẫn khách hàng quét QR hoặc mở liên kết thanh toán.');
        }

        return;
      }

      const { data: draftData } = await cashierApi.createInvoiceDraft(basePayload);
      const { data: confirmData } = await cashierApi.confirmPayment({
        invoiceCode: draftData.invoiceCode,
        cashierId: user.id,
      });
      finalizePaidInvoice(confirmData);
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err?.message || 'Thanh toán thất bại');
    } finally {
      setCreating(false);
    }
  }, [
    customerMoney,
    finalizePaidInvoice,
    paymentMethod,
    prescription,
    selectedCodes,
    totalSelected,
    user,
  ]);

  const handleRefreshTransaction = useCallback(async () => {
    if (!createdInvoice || createdInvoice.paymentMethod !== 'TRANSFER') return;

    setRefreshingTransaction(true);
    try {
      const { returnUrl, cancelUrl } = getPayosUrls();
      const { data } = await cashierApi.refreshTransferTransaction(createdInvoice.invoiceCode, {
        returnUrl,
        cancelUrl,
      });
      if (data.paymentStatus && ['PAID', 'SUCCEEDED'].includes(data.paymentStatus)) {
        finalizePaidInvoice(data);
      } else {
        setCreatedInvoice(data);
        setPaymentModalOpen(true);
        toast.success('Đã làm mới liên kết thanh toán PayOS');
      }
    } catch (err: any) {
      console.error('Refresh transaction error:', err);
      toast.error(err?.message || 'Không thể làm mới liên kết thanh toán');
    } finally {
      setRefreshingTransaction(false);
    }
  }, [createdInvoice, finalizePaidInvoice, getPayosUrls]);

  const handleManualConfirm = useCallback(async () => {
    if (!createdInvoice || createdInvoice.paymentMethod !== 'TRANSFER' || !user) return;

    const transactionId = createdInvoice.transaction?.id || createdInvoice.transaction?.providerTransactionId;
    if (!transactionId) {
      toast.error('Không tìm thấy mã giao dịch để xác nhận thủ công');
      return;
    }

    setManualConfirming(true);
    try {
      const { data } = await cashierApi.confirmPayment({
        invoiceCode: createdInvoice.invoiceCode,
        cashierId: user.id,
        transactionId,
      });

      if (data.paymentStatus && ['PAID', 'SUCCEEDED'].includes(data.paymentStatus)) {
        finalizePaidInvoice(data);
        return;
      }

      setCreatedInvoice(data);
      setConfirmResult(null);
      toast.warning('PayOS vẫn chưa xác nhận giao dịch. Vui lòng thử lại sau hoặc chờ webhook.');
    } catch (err: any) {
      console.error('Manual confirm error:', err);
      toast.error(err?.message || 'Không thể xác nhận thanh toán chuyển khoản');
    } finally {
      setManualConfirming(false);
    }
  }, [createdInvoice, finalizePaidInvoice, user]);

  const handlePrint = (mode: 'invoice' | 'routing' | 'payment') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setPrintMode('none');
    }, 50);
  };

  // Realtime: listen for PayOS webhook result via socket and auto finalize
  useEffect(() => {
    if (!user?.id) {
      if (socketRef.current) {
        try {
          socketRef.current.emit('leave_cashier');
          socketRef.current.disconnect();
        } catch {
          // noop
        }
        socketRef.current = null;
      }
      return;
    }

    const envUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_QUEUE_SOCKET_URL?.trim() : undefined;
    const baseUrl = envUrl || (typeof window !== 'undefined' ? `${window.location.origin}/counters` : '');
    if (!baseUrl) return;

    const socket = io(baseUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });
    socketRef.current = socket;

    const cashierId = user.id;
    setSocketLog(prev => [`socket url: ${baseUrl}${!envUrl ? ' (fallback)' : ''}`, ...prev].slice(0, 10));
    const handleConnect = () => {
      setSocketLog(prev => [`emit: join_cashier { cashierId: ${cashierId} }`, ...prev].slice(0, 10));
      socket.emit('join_cashier', { cashierId });
    };

    socket.on('connect', handleConnect);
    socket.on('joined_cashier', () => {
      // joined cashier room
      setSocketLog(prev => [`on: joined_cashier`, ...prev].slice(0, 10));
    });
    socket.on('disconnect', (reason: string) => {
      setSocketLog(prev => [`socket disconnected: ${reason}`, ...prev].slice(0, 10));
    });
    socket.on('connect_error', (err: any) => {
      setSocketLog(prev => [`connect_error: ${err?.message || 'unknown'}`, ...prev].slice(0, 10));
    });

    // When payment succeeded (webhook processed), get invoice details and download PDF
    socket.on('invoice_payment_success', async (payload: any) => {
      try {
        const invoiceId = payload?.data?.invoiceId || payload?.invoiceId;
        const invoiceCode = payload?.data?.invoiceCode || payload?.invoiceCode;
        const targetCashier = payload?.data?.cashierId || payload?.cashierId;
        
        if (!invoiceId) {
          console.log('No invoiceId in payload, trying invoiceCode:', invoiceCode);
          return;
        }
        if (targetCashier && targetCashier !== cashierId) return;

        // Call new API to get invoice details
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        
        const response = await fetch(`${API_BASE_URL}/invoice-payments/invoice-by-id/${invoiceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('Failed to fetch invoice details:', response.status, response.statusText);
          return;
        }

        const invoiceResponse = await response.json();
        console.log('Invoice details received:', invoiceResponse);

        if (invoiceResponse?.success && invoiceResponse?.data) {
          const invoiceData = invoiceResponse.data;
          
          // Transform the data to match expected format
          const transformedData = {
            invoiceCode: invoiceData.invoiceCode,
            totalAmount: invoiceData.totalAmount,
            paymentStatus: invoiceData.paymentStatus,
            paymentMethod: invoiceData.paymentMethod,
            patientInfo: {
              name: invoiceData.patientProfile?.name,
              dateOfBirth: invoiceData.patientProfile?.dateOfBirth,
              gender: invoiceData.patientProfile?.gender,
            },
            prescriptionInfo: {
              prescriptionCode: invoiceData.invoiceDetails?.[0]?.prescription?.prescriptionCode,
              status: invoiceData.invoiceDetails?.[0]?.prescription?.status,
              doctorName: invoiceData.invoiceDetails?.[0]?.prescription?.doctor?.auth?.name,
            },
            invoiceDetails: invoiceData.invoiceDetails?.map((detail: any) => ({
              serviceCode: detail.service?.serviceCode,
              serviceName: detail.service?.name,
              price: detail.service?.price,
            })) || [],
            routingAssignments: [], // This might need to be populated from another API
            transaction: invoiceData.paymentTransactions?.[0] || null,
          };

          // Auto download PDF immediately with correct payment data
          setTimeout(() => {
            exportSectionAsPdf('invoice', transformedData, invoiceData.amountPaid || invoiceData.totalAmount);
          }, 500);

          // Show success message
          toast.success('Thanh toán thành công! Đang tải xuống hóa đơn...');
        }
      } catch (error) {
        console.error('Error processing payment success:', error);
        toast.error('Có lỗi xảy ra khi xử lý thanh toán thành công');
      }
    });

    socket.on('error', () => {});
    socket.on('disconnect', () => {});

    handleConnect();

    return () => {
      try {
        socket.emit('leave_cashier');
        setSocketLog(prev => [`emit: leave_cashier`, ...prev].slice(0, 10));
      } finally {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user?.id, finalizePaidInvoice]);

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

          {socketLog.length > 0 && (
            <div className="bg-indigo-50 px-3 py-2 rounded border border-indigo-200 text-[11px] max-w-[420px] overflow-hidden">
              <div className="font-medium text-indigo-800 mb-1">Socket events</div>
              <div className="space-y-1 text-indigo-700">
                {socketLog.slice(0, 3).map((l, idx) => (
                  <div key={idx} className="truncate">{l}</div>
                ))}
              </div>
            </div>
          )}

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
                    {!isTransferPayment && (
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
                    )}

                    <div className="space-y-2">
                      <Label>Phương thức thanh toán</Label>
                      <div className="flex gap-2">
                        {[
                          { value: 'CASH', label: '💵 Tiền mặt', color: 'bg-green-100 text-green-800' },
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

                    {!isTransferPayment && customerMoney && parseInt(customerMoney) >= totalSelected && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-sm flex items-center justify-between">
                          <span>Tiền thối lại:</span>
                          <span className="font-semibold text-green-600 text-lg">
                            {(parseInt(customerMoney) - totalSelected).toLocaleString()} đ
                          </span>
                        </div>
                      </div>
                    )}

                    {!isTransferPayment && customerMoney && parseInt(customerMoney) < totalSelected && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="text-sm text-red-600">
                          Thiếu {(totalSelected - parseInt(customerMoney)).toLocaleString()} đ
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={onPayment}
                      disabled={
                        creating ||
                        selectedCodes.length === 0 ||
                        (!isTransferPayment && (!customerMoney || parseInt(customerMoney) < totalSelected))
                      }
                    >
                      {creating
                        ? 'Đang xử lý...'
                        : isTransferPayment
                          ? 'Tạo yêu cầu chuyển khoản'
                          : 'Thanh toán'}
                    </Button>
                    {isTransferPayment && !creating && (
                      <p className="text-xs text-muted-foreground text-center">
                        Hệ thống sẽ cung cấp QR và liên kết PayOS sau khi tạo yêu cầu.
                      </p>
                    )}
                  </>
                )}

                {createdInvoice && (
                  <div
                    className={`p-3 rounded-lg border space-y-2 ${
                      isCreatedInvoicePaid
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                  >
                    <div className="text-sm flex items-center justify-between">
                      <span>
                        {isCreatedInvoicePaid
                          ? '✅ Thanh toán thành công!'
                          : '⏳ Đang chờ khách thanh toán qua PayOS'}
                      </span>
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
                          setManualConfirming(false);
                          setRefreshingTransaction(false);
                        }}
                      >
                        Giao dịch mới
                      </Button>
                    </div>
                    <div className="text-xs">
                      Mã hóa đơn: {createdInvoice?.invoiceCode}
                    </div>
                    <div className="text-xs">
                      Trạng thái: {createdInvoice?.paymentStatus}
                    </div>
                    {isCreatedInvoiceTransferPending && (
                      <div className="text-xs">
                        Chia sẻ QR hoặc liên kết bên dưới cho khách hàng. Khi khách thanh toán thành công, hệ thống sẽ tự động cập nhật.
                      </div>
                    )}
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
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span>Mã hoá đơn: <span className="font-semibold">{createdInvoice?.invoiceCode}</span></span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => createdInvoice?.invoiceCode && copyToClipboard(createdInvoice.invoiceCode, 'Đã sao chép mã hoá đơn')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div>Tổng tiền: <span className="font-semibold">{createdInvoice?.totalAmount.toLocaleString()} đ</span></div>
                    <div className="flex items-center gap-2">
                      <span>Trạng thái:</span>
                      <Badge variant="secondary" className={getPaymentStatusBadgeClass(createdInvoice?.paymentStatus)}>
                        {createdInvoice?.paymentStatus || 'ĐANG CẬP NHẬT'}
                      </Badge>
                    </div>
                    {createdInvoice?.paymentMethod && (
                      <div>Phương thức: {PAYMENT_METHOD_LABEL[createdInvoice.paymentMethod] || createdInvoice.paymentMethod}</div>
                    )}
                    {createdInvoice?.transaction?.orderCode && (
                      <div className="flex items-center gap-2">
                        <span>Mã đơn PayOS: <span className="font-semibold">{createdInvoice.transaction.orderCode}</span></span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            createdInvoice?.transaction?.orderCode &&
                            copyToClipboard(createdInvoice.transaction.orderCode, 'Đã sao chép mã đơn PayOS')
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {isCreatedInvoiceTransferPending && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setPaymentModalOpen(true)}>
                        <QrCode className="h-4 w-4 mr-1" /> Xem thông tin thanh toán
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefreshTransaction}
                        disabled={refreshingTransaction}
                      >
                        <RefreshCcw className="h-4 w-4 mr-1" />
                        {refreshingTransaction ? 'Đang làm mới...' : 'Làm mới liên kết'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleManualConfirm}
                        disabled={manualConfirming}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {manualConfirming ? 'Đang xác nhận...' : 'Xác nhận thủ công'}
                      </Button>
                    </div>
                  )}

                  {/* Payment info modal */}
                  <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Thông tin thanh toán PayOS</DialogTitle>
                      </DialogHeader>

                      {createdInvoice?.transaction && (
                        <div className="space-y-3">
                          <div className="text-sm">Số tiền: <span className="font-semibold">{createdInvoice.totalAmount.toLocaleString()} đ</span></div>
                          {createdInvoice.transaction.expiredAt && (
                            <div className="text-xs text-purple-700">Hết hạn: {formatDateTime(createdInvoice.transaction.expiredAt)}</div>
                          )}

                          {createdInvoice.transaction.qrCode && (
                            <div className="flex flex-col items-center gap-2">
                              {createdInvoiceQrImage ? (
                                <img src={createdInvoiceQrImage} alt="QR PayOS" className="w-56 h-56 object-contain rounded bg-white p-2" />
                              ) : (
                                <div className="rounded bg-white/80 px-3 py-2 text-center text-xs text-purple-700">
                                  Không thể hiển thị mã QR tự động, hãy sử dụng chuỗi dữ liệu bên dưới.
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const qr = createdInvoice.transaction && createdInvoice.transaction.qrCode;
                                  if (qr) copyToClipboard(qr, 'Đã sao chép nội dung QR chuyển khoản');
                                }}
                              >
                                <Clipboard className="h-4 w-4 mr-1" /> Sao chép nội dung QR
                              </Button>
                              <div className="w-full rounded bg-white/70 p-2 text-[11px] text-purple-700 break-all">
                                {createdInvoice.transaction.qrCode}
                              </div>
                            </div>
                          )}

                          {createdInvoice.transaction.paymentUrl && (
                            <div className="space-y-1 text-xs">
                              <div className="break-all">Liên kết: {createdInvoice.transaction.paymentUrl}</div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const url = createdInvoice.transaction && createdInvoice.transaction.paymentUrl;
                                    if (url) window.open(url, '_blank', 'noopener');
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" /> Mở PayOS
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const url = createdInvoice.transaction && createdInvoice.transaction.paymentUrl;
                                    if (url) copyToClipboard(url, 'Đã sao chép liên kết PayOS');
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-1" /> Sao chép liên kết
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => handlePrint('payment')}>
                              <Printer className="h-4 w-4 mr-1" /> In phiếu thanh toán
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

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
            {confirmResult?.transaction?.qrCode && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <span className="text-sm font-semibold">QR chuyển khoản PayOS</span>
                {confirmedInvoiceQrImage ? (
                  <img
                    src={confirmedInvoiceQrImage}
                    alt="QR PayOS"
                    className="h-40 w-40 object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-600 text-center">
                    Không thể hiển thị mã QR, vui lòng sử dụng liên kết thanh toán: {confirmResult.transaction.paymentUrl}
                  </span>
                )}
              </div>
            )}
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

      {/* Payment slip for QR (print-friendly) */}
      {createdInvoice?.transaction && (
        <div className={printMode === 'payment' ? '' : 'hidden print:block'}>
          <div id="print-payment" data-print-scope className={printMode === 'payment' ? 'block' : 'hidden'}>
            <h2 className="text-xl font-semibold mb-2">Phiếu thanh toán chuyển khoản</h2>
            <div className="text-sm mb-2">Mã hoá đơn: {createdInvoice?.invoiceCode}</div>
            <div className="text-sm mb-2">Số tiền: {createdInvoice?.totalAmount?.toLocaleString()} đ</div>
            <Separator className="my-2" />
            {createdInvoice.transaction.qrCode && (
              <div className="mt-2 flex flex-col items-center gap-2">
                {createdInvoiceQrImage ? (
                  <img
                    src={createdInvoiceQrImage}
                    alt="QR PayOS"
                    className="h-48 w-48 object-contain bg-white p-2 rounded"
                  />
                ) : (
                  <span className="text-xs text-gray-600 text-center">
                    Không thể hiển thị mã QR, vui lòng dùng liên kết: {createdInvoice.transaction.paymentUrl}
                  </span>
                )}
              </div>
            )}
            {createdInvoice.transaction.orderCode && (
              <div className="text-sm mt-2">Mã đơn PayOS: {createdInvoice.transaction.orderCode}</div>
            )}
            {createdInvoice.transaction.paymentUrl && (
              <div className="text-xs mt-1 break-all">Liên kết thanh toán: {createdInvoice.transaction.paymentUrl}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
