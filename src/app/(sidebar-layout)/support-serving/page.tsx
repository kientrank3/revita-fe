"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { receptionService, type PendingServicesResponse, type AssignNextServiceResponse } from '@/lib/services/reception.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { QrCode, Camera, CameraOff, AlertTriangle, User, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

export default function SupportServingPage() {
  const [prescriptionCode, setPrescriptionCode] = useState<string>("");
  const [pendingData, setPendingData] = useState<PendingServicesResponse | null>(null);
  const [assignResult, setAssignResult] = useState<AssignNextServiceResponse | null>(null);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const [loadingAssign, setLoadingAssign] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  
  // QR Scanner states
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const [scannerSupported, setScannerSupported] = useState<boolean | null>(null);
  const [scanHint, setScanHint] = useState<string>('Đang khởi động camera...');
  const [usingHtml5Qrcode, setUsingHtml5Qrcode] = useState(false);
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrMediaStreamRef = useRef<MediaStream | null>(null);
  const qrHtml5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const qrLastScanRef = useRef<string | null>(null);
  const qrLastScanTsRef = useRef<number>(0);
  const qrScanningRef = useRef(false);

  const canQuery = useMemo(() => prescriptionCode.trim().length > 0, [prescriptionCode]);

  const handleFetchPending = useCallback(async (code?: string) => {
    const codeToFetch = code || prescriptionCode.trim();
    if (!codeToFetch) return;
    setError("");
    setAssignResult(null);
    setSelectedServiceIds(new Set()); // Clear selections when fetching new data
    setLoadingPending(true);
    try {
      const data = await receptionService.getPendingServices(codeToFetch);
      setPendingData(data);
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message || 'Không thể lấy thông tin phiếu chỉ định';
      setPendingData(null);
      setError(message);
    } finally {
      setLoadingPending(false);
    }
  }, [prescriptionCode]);

  const handleAssignNext = useCallback(async () => {
    if (!pendingData?.prescriptionCode) return;
    
    // Check if any service is selected
    if (selectedServiceIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ để gán');
      return;
    }
    
    setError("");
    setLoadingAssign(true);
    try {
      const res = await receptionService.assignNextService({ 
        prescriptionCode: pendingData.prescriptionCode,
        prescriptionServiceIds: Array.from(selectedServiceIds)
      });
      setAssignResult(res);
      // Clear selected services after successful assignment
      setSelectedServiceIds(new Set());
      // Optionally refresh pending list after assignment
      try {
        const refreshed = await receptionService.getPendingServices(pendingData.prescriptionCode);
        setPendingData(refreshed);
      } catch {
        // ignore refresh failure
      }
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể gán dịch vụ tiếp theo';
      setError(message);
    } finally {
      setLoadingAssign(false);
    }
  }, [pendingData?.prescriptionCode, selectedServiceIds]);

  // QR Scanner handlers
  const stopQrScanner = useCallback(async () => {
    setQrScanning(false);
    qrScanningRef.current = false;
    setUsingHtml5Qrcode(false);
    
    // Stop html5-qrcode if running
    if (qrHtml5QrCodeRef.current) {
      try {
        await qrHtml5QrCodeRef.current.stop();
        await qrHtml5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('[QR] Error stopping html5-qrcode:', e);
      }
      qrHtml5QrCodeRef.current = null;
    }
    
    // Stop media stream
    const stream = qrMediaStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      qrMediaStreamRef.current = null;
    }
    if (qrVideoRef.current) {
      qrVideoRef.current.srcObject = null;
    }
  }, []);

  const handleQrText = useCallback(async (text: string) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    
    console.log('[QR] Raw:', text);
    const upper = trimmed.toUpperCase();
    
    // Parse mã prescription code từ format: PRE:PRE-xxx|... hoặc PRE-xxx|... hoặc PR-xxx|...
    let prescriptionCodeParsed = trimmed;
    
    // Kiểm tra nếu có format PRE:PRE-xxx hoặc PRE:PR-xxx
    if (trimmed.includes(':')) {
      const parts = trimmed.split('|');
      // Lấy phần đầu tiên (PRE:PRE-xxx)
      const firstPart = parts[0] || '';
      if (firstPart.includes(':')) {
        // Tách theo dấu : để lấy mã prescription code
        const codeParts = firstPart.split(':');
        if (codeParts.length >= 2) {
          prescriptionCodeParsed = codeParts[1].trim();
        }
      }
    } else {
      // Nếu không có format đặc biệt, lấy phần đầu trước dấu |
      const codeParts = trimmed.split('|');
      prescriptionCodeParsed = codeParts[0]?.trim() || trimmed;
    }
    
    console.log('[QR] Parsed prescription code:', prescriptionCodeParsed);
    setScanHint(`Đã quét mã: ${prescriptionCodeParsed.slice(0, 24)}${prescriptionCodeParsed.length > 24 ? '...' : ''}`);
    
    // Kiểm tra nếu mã bắt đầu bằng PRE hoặc PR
    if (!upper.startsWith('PRE') && !upper.startsWith('PR-')) {
      toast.error('Mã QR không phải mã phiếu chỉ định (PRE... hoặc PR-...)');
      setScanHint('Mã QR không đúng định dạng');
      return;
    }
    
    // Điền mã vào input
    setPrescriptionCode(prescriptionCodeParsed);
    toast.success(`Đã quét mã: ${prescriptionCodeParsed}`);
    
    // Đóng scanner sau khi quét thành công
    setTimeout(async () => {
      setIsQrScannerOpen(false);
      await stopQrScanner();
      
      // Tự động tra cứu sau khi đóng scanner - truyền trực tiếp mã vào hàm
      setTimeout(async () => {
        await handleFetchPending(prescriptionCodeParsed);
      }, 300); // Small delay to ensure scanner is fully closed and state is updated
    }, 500);
  }, [stopQrScanner, handleFetchPending]);

  const startQrScanner = useCallback(async () => {
    setQrScanning(true);
    qrScanningRef.current = true;
    setScanHint('Đang khởi động camera...');
    
    try {
      // Prefer back camera; fallback to any camera
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } }
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch {
          throw new Error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
        }
      }
      
      console.log('[QR] Got media stream:', !!stream);
      qrMediaStreamRef.current = stream;
      const video = qrVideoRef.current;
      if (!video) {
        console.warn('[QR] videoRef.current is null');
        return;
      }
      
      video.srcObject = stream;
      await video.play();

      // Wait until video metadata is ready
      if (video.readyState < 2) {
        await new Promise<void>((resolve) => {
          const onLoaded = () => { resolve(); };
          video.addEventListener('loadeddata', onLoaded, { once: true });
        });
      }
      
      console.log('[QR] Video ready');
      setScanHint('Camera đã sẵn sàng. Đưa mã QR vào khung...');

      // Try BarcodeDetector first
      interface BarcodeDetectorInterface {
        detect(image: HTMLVideoElement): Promise<Array<{ rawValue?: string; rawValueText?: string; raw?: string }>>;
      }
      
      const BD = (window as { BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorInterface }).BarcodeDetector;
      const isBarcodeDetectorSupported = typeof BD !== 'undefined';
      
      if (isBarcodeDetectorSupported) {
        console.log('[QR] Trying BarcodeDetector...');
        setScannerSupported(true);
        setUsingHtml5Qrcode(false);
        let detector: BarcodeDetectorInterface | null = null;
        try {
          detector = new BD({ formats: ['qr_code'] });
        } catch {
          try {
            detector = new BD();
          } catch (e) {
            console.log('[QR] BarcodeDetector init failed, will use fallback:', e);
          }
        }
        
        if (detector) {
          console.log('[QR] BarcodeDetector initialized');
          const tick = async () => {
            if (!qrScanningRef.current || !qrVideoRef.current) {
              return;
            }
            
            try {
              const detections = await detector!.detect(qrVideoRef.current);
              if (detections && detections.length > 0) {
                const raw = (detections[0]?.rawValue ?? detections[0]?.rawValueText ?? detections[0]?.raw ?? '').toString();
                if (raw) {
                  const norm = raw.trim();
                  const now = Date.now();
                  // Debounce
                  if (qrLastScanRef.current === norm && now - qrLastScanTsRef.current < 1500) {
                    // skip duplicate
                  } else {
                    qrLastScanRef.current = norm;
                    qrLastScanTsRef.current = now;
                    console.log('[QR] Found QR code:', norm);
                    await handleQrText(norm);
                  }
                }
              }
            } catch (err) {
              console.warn('[QR] detect error:', err);
            }
            
            if (qrScanningRef.current) {
              requestAnimationFrame(tick);
            }
          };
          
          setScanHint('Đưa mã QR vào trong khung...');
          requestAnimationFrame(tick);
          return;
        }
      }
      
      // Fallback to html5-qrcode
      console.log('[QR] Using html5-qrcode fallback...');
      try {
        setScannerSupported(true);
        setUsingHtml5Qrcode(true);
        setScanHint('Đang khởi động bộ quét QR...');
        
        // Stop the current video stream
        if (qrMediaStreamRef.current) {
          qrMediaStreamRef.current.getTracks().forEach(t => t.stop());
          qrMediaStreamRef.current = null;
        }
        if (qrVideoRef.current) {
          qrVideoRef.current.srcObject = null;
        }
        
        const html5QrCode = new Html5Qrcode('support-qr-reader');
        qrHtml5QrCodeRef.current = html5QrCode;
        
        const qrCodeSuccessCallback = async (decodedText: string) => {
          const norm = decodedText.trim();
          const now = Date.now();
          
          // Debounce
          if (qrLastScanRef.current === norm && now - qrLastScanTsRef.current < 1500) {
            return;
          }
          
          qrLastScanRef.current = norm;
          qrLastScanTsRef.current = now;
          console.log('[QR] Found QR code (html5-qrcode):', norm);
          await handleQrText(norm);
        };
        
        const qrCodeErrorCallback = (errorMessage: string) => {
          // Ignore common "not found" errors
          if (!errorMessage.includes('No QR code found') && !errorMessage.includes('NotFoundException')) {
            // Keep scanning
          }
        };
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        };
        
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          );
        } catch {
          try {
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              qrCodeSuccessCallback,
              qrCodeErrorCallback
            );
          } catch {
            try {
              const cameras = await Html5Qrcode.getCameras();
              const cameraId = cameras[0]?.id;
              if (cameraId) {
                await html5QrCode.start(
                  cameraId,
                  config,
                  qrCodeSuccessCallback,
                  qrCodeErrorCallback
                );
              } else {
                throw new Error('Không tìm thấy camera');
              }
            } catch (finalError) {
              console.error('[QR] All camera options failed:', finalError);
              throw finalError;
            }
          }
        }
        
        setScanHint('Đưa mã QR vào trong khung...');
        console.log('[QR] html5-qrcode started successfully');
      } catch (html5Error) {
        console.error('[QR] html5-qrcode failed:', html5Error);
        setScannerSupported(false);
        const error = html5Error instanceof Error ? html5Error : new Error('Không thể khởi động bộ quét QR');
        toast.error(`Không thể khởi động quét QR: ${error.message}`);
        setScanHint('Lỗi khởi động bộ quét QR');
      }
    } catch (e) {
      setQrScanning(false);
      qrScanningRef.current = false;
      const error = e instanceof Error ? e : new Error('Không thể truy cập camera');
      console.error('[QR] getUserMedia error:', error);
      toast.error(error.message || 'Không thể truy cập camera');
      setScanHint('Lỗi khởi động camera');
    }
  }, [handleQrText]);

  // Handle QR scanner dialog open/close
  useEffect(() => {
    if (isQrScannerOpen) {
      setTimeout(() => {
        startQrScanner();
      }, 100);
    } else {
      stopQrScanner();
    }
    
    return () => {
      stopQrScanner();
    };
  }, [isQrScannerOpen, startQrScanner, stopQrScanner]);

  return (
    <div className="p-4 space-y-4 px-8">
      <Card>
        <CardHeader>
          <CardTitle>Quầy hỗ trợ thực hiện dịch vụ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                placeholder="Nhập mã phiếu chỉ định (PRE... hoặc PR-...)"
                value={prescriptionCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPrescriptionCode(e.target.value);
                  // Clear pending data when input is cleared
                  if (!e.target.value.trim()) {
                    setPendingData(null);
                    setAssignResult(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canQuery && !loadingPending) {
                    handleFetchPending();
                  }
                }}
              />
            </div>
            <Button onClick={() => handleFetchPending()} disabled={!canQuery || loadingPending}>
              {loadingPending ? 'Đang tải...' : 'Xem dịch vụ chờ'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsQrScannerOpen(true)}
              title="Quét QR code"
            >
              <QrCode className="h-4 w-4 mr-2" /> Quét QR
            </Button>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {pendingData && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Mã phiếu: <span className="font-medium text-foreground">{pendingData.prescriptionCode}</span> · 
                Trạng thái: <span className="font-medium text-foreground">
                  {pendingData.status === 'PENDING' ? 'Chờ thực hiện' : 
                   pendingData.status === 'RESCHEDULED' ? 'Đã hẹn lại' : 
                   'Hỗn hợp'}
                </span> · 
                Tổng dịch vụ chờ: {pendingData.totalCount}
              </div>

              {/* Cảnh báo nếu có bác sĩ/kỹ thuật viên không làm việc */}
              {pendingData.services.some(s => s.isDoctorNotWorking || s.isTechnicianNotWorking) && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-800">Cảnh báo</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Có dịch vụ được hẹn lại với bác sĩ/kỹ thuật viên hiện không làm việc hôm nay. 
                        Vui lòng kiểm tra và liên hệ để bố trí lại.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Danh sách dịch vụ {pendingData.status === 'RESCHEDULED' ? 'ĐÃ HẸN LẠI' : pendingData.status === 'MIXED' ? 'CHỜ THỰC HIỆN & ĐÃ HẸN LẠI' : 'CHỜ THỰC HIỆN'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={pendingData.services.length > 0 && pendingData.services.every(s => selectedServiceIds.has(s.prescriptionServiceId))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Select all
                                setSelectedServiceIds(new Set(pendingData.services.map(s => s.prescriptionServiceId)));
                              } else {
                                // Deselect all
                                setSelectedServiceIds(new Set());
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>#</TableHead>
                        <TableHead>Tên dịch vụ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Bác sĩ</TableHead>
                        <TableHead>Kỹ thuật viên</TableHead>
                        <TableHead>Service ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingData.services.map((s, idx: number) => {
                        const isRescheduled = s.status === 'RESCHEDULED';
                        const isWaitingResult = s.status === 'WAITING_RESULT';
                        const hasDoctor = s.doctorId && s.doctorName;
                        const hasTechnician = s.technicianId && s.technicianName;
                        const doctorNotWorking = s.isDoctorNotWorking === true;
                        const technicianNotWorking = s.isTechnicianNotWorking === true;
                        const isSelected = selectedServiceIds.has(s.prescriptionServiceId);
                        
                        // Get status text and color
                        let statusText = 'Chờ thực hiện';
                        let statusVariant: "default" | "secondary" | "destructive" | "outline" = "default";
                        let statusClassName = "";
                        
                        if (isRescheduled) {
                          statusText = 'Đã hẹn lại';
                          statusVariant = "secondary";
                          statusClassName = "bg-orange-100 text-orange-800 border-orange-200";
                        } else if (isWaitingResult) {
                          statusText = 'Chờ kết quả';
                          statusVariant = "secondary";
                          statusClassName = "bg-cyan-100 text-cyan-800 border-cyan-200";
                        }
                        
                        return (
                          <TableRow key={s.prescriptionServiceId}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const newSet = new Set(selectedServiceIds);
                                  if (checked) {
                                    newSet.add(s.prescriptionServiceId);
                                  } else {
                                    newSet.delete(s.prescriptionServiceId);
                                  }
                                  setSelectedServiceIds(newSet);
                                }}
                              />
                            </TableCell>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{s.serviceName}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={statusVariant}
                                className={statusClassName}
                              >
                                {statusText}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {hasDoctor ? (
                                <div className="flex items-center gap-1">
                                  <Stethoscope className="h-3 w-3 text-blue-600" />
                                  <span className="text-sm">{s.doctorName}</span>
                                  {doctorNotWorking && (
                                    <Badge variant="destructive" className="text-xs ml-1">
                                      <AlertTriangle className="h-2 w-2 mr-1" />
                                      Không làm việc
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">--</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {hasTechnician ? (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-green-600" />
                                  <span className="text-sm">{s.technicianName}</span>
                                  {technicianNotWorking && (
                                    <Badge variant="destructive" className="text-xs ml-1">
                                      <AlertTriangle className="h-2 w-2 mr-1" />
                                      Không làm việc
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">--</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{s.serviceId}</TableCell>
                          </TableRow>
                        );
                      })}
                      {pendingData.services.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                            Không có dịch vụ {pendingData.status === 'RESCHEDULED' ? 'đã hẹn lại' : 'chờ thực hiện'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleAssignNext} 
                  disabled={loadingAssign || selectedServiceIds.size === 0}
                >
                  {loadingAssign ? 'Đang gán...' : `Gán ${selectedServiceIds.size} dịch vụ đã chọn`}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {selectedServiceIds.size > 0 
                    ? `Đã chọn ${selectedServiceIds.size}/${pendingData.services.length} dịch vụ`
                    : 'Vui lòng chọn ít nhất một dịch vụ để gán'}
                </span>
              </div>

              {assignResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Kết quả gán</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Single service result */}
                    {assignResult.assignedService && (
                      <>
                        <div className="text-sm">
                          Đã chuyển dịch vụ <span className="font-medium">{assignResult.assignedService.serviceId}</span> sang trạng thái <span className="font-medium">{assignResult.assignedService.status}</span>
                        </div>
                        <Separator />
                      </>
                    )}
                    
                    {/* Multiple services result */}
                    {assignResult.assignedServices && assignResult.assignedServices.length > 0 && (
                      <>
                        <div className="text-sm">
                          Đã chuyển <span className="font-medium">{assignResult.assignedServices.length}</span> dịch vụ:
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                          {assignResult.assignedServices.map((service, idx) => (
                            <li key={idx}>
                              <span className="font-medium">{service.serviceId}</span> - Trạng thái: <span className="font-medium">{service.status}</span>
                            </li>
                          ))}
                        </ul>
                        <Separator />
                      </>
                    )}
                    
                    {/* Session info */}
                    {assignResult.chosenSession && (
                      <>
                        <div className="text-sm">
                          Phiên được chọn: <span className="font-medium">{assignResult.chosenSession.id}</span>
                          {assignResult.chosenSession.doctorId ? (
                            <>
                              {' '}· Bác sĩ: <span className="font-medium">{assignResult.chosenSession.doctorId}</span>
                            </>
                          ) : null}
                          {assignResult.chosenSession.technicianId ? (
                            <>
                              {' '}· Kỹ thuật viên: <span className="font-medium">{assignResult.chosenSession.technicianId}</span>
                            </>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Thời gian: {new Date(assignResult.chosenSession.startTime).toLocaleString()} - {new Date(assignResult.chosenSession.endTime).toLocaleString()}
                        </div>
                      </>
                    )}
                    
                    {/* Queue preview */}
                    {assignResult.queuePreview && (
                      <div className="text-sm text-muted-foreground">
                        Ảnh chụp hàng đợi: {assignResult.queuePreview.totalCount} bệnh nhân
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Scanner Dialog */}
      <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Quét mã QR phiếu chỉ định
            </DialogTitle>
            <DialogDescription>
              Đưa mã QR của phiếu chỉ định (PRE... hoặc PR-...) vào khung hình để quét tự động
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
              {/* Video element for BarcodeDetector */}
              <video
                ref={qrVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${usingHtml5Qrcode ? 'hidden' : ''}`}
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* HTML5 QR Code reader container */}
              <div id="support-qr-reader" className="w-full h-full"></div>
              
              {/* Scanning overlay for BarcodeDetector mode */}
              {qrScanning && !usingHtml5Qrcode && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white rounded-lg w-[80%] h-[80%] relative">
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>
              )}
              
              {!qrScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Camera chưa sẵn sàng</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">{scanHint}</p>
              {scannerSupported === false && (
                <p className="text-xs text-red-600 mt-2">
                  Trình duyệt không hỗ trợ quét QR. Vui lòng sử dụng trình duyệt hiện đại hơn.
                </p>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={async () => {
                  await stopQrScanner();
                  setIsQrScannerOpen(false);
                }}
              >
                Đóng
              </Button>
              {!qrScanning && (
                <Button
                  onClick={startQrScanner}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Khởi động lại
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


