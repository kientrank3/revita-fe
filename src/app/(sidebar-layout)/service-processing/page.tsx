/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ScanLine,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  FileCheck,
  Stethoscope,
  Users,
  PhoneCall,
  SkipForward,
  QrCode,
  Camera,
  CameraOff,
  Search
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { serviceProcessingService } from '@/lib/services/service-processing.service';
import { workSessionService } from '@/lib/services/work-session.service';
import type { WorkSession as WS } from '@/lib/types/work-session';
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
  // const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  
  // QR Scanner states
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const [scannerSupported, setScannerSupported] = useState<boolean | null>(null);
  const [scanHint, setScanHint] = useState<string>('Đang khởi động camera...');
  const qrVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const qrMediaStreamRef = React.useRef<MediaStream | null>(null);
  const qrHtml5QrCodeRef = React.useRef<Html5Qrcode | null>(null);
  const qrLastScanRef = React.useRef<string | null>(null);
  const qrLastScanTsRef = React.useRef<number>(0);
  const qrScanningRef = React.useRef(false);
  const [workSession, setWorkSession] = useState<WorkSession | null>(null);
  const [myServices, setMyServices] = useState<GetMyServicesResponse['services']>([]);
  const [loadingMyServices, setLoadingMyServices] = useState(false);
  const [updatingService, setUpdatingService] = useState<string | null>(null);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<PrescriptionService | null>(null);
  const [selectedPatientForResults, setSelectedPatientForResults] = useState<{
    patientProfileId: string;
    services: Array<{ prescriptionId: string; serviceId: string; serviceName: string; order: number; status: string }>;
  } | null>(null);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [todaySessions, setTodaySessions] = useState<WS[]>([]);
  const [processingSessionId, setProcessingSessionId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [queue, setQueue] = useState<{
    patients: Array<{
      patientProfileId: string;
      patientName: string;
      prescriptionCode: string;
      services: Array<{ prescriptionId: string; serviceId: string; serviceName: string; order: number; status: string }>;
      overallStatus: 'SERVING' | 'PREPARING' | 'SKIPPED' | 'WAITING_RESULT' | 'RETURNING' | 'WAITING';
      queueOrder: number;
    }>;
    totalCount: number;
  } | null>(null);
  const [callingNext, setCallingNext] = useState(false);
  const [skippingPatient, setSkippingPatient] = useState<string | null>(null);

  // Load work session and my services on mount
  useEffect(() => {
    if (user?.id) {
      console.log('User authenticated:', user);
      console.log('Loading service processing data...');

      loadMyServices();
      // Load waiting queue
      (async () => {
        try {
          const q = await serviceProcessingService.getWaitingQueue();
          setQueue(q);
        } catch (e) {
          console.error('Error loading queue', e);
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Socket connection and event listeners
  useEffect(() => {
    console.log('Socket connection and event listeners');
    if (!user?.id) return;

    // Only connect if Socket.IO URL is configured
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) {
      console.log('[Socket] NEXT_PUBLIC_SOCKET_URL not configured, skipping socket connection');
      return;
    }

    console.log('🔄 [Socket] Đang bắt đầu kết nối...');
    console.log('📍 [Socket] URL:', socketUrl);
    console.log('👨‍⚕️ [Socket] Doctor ID:', user.id);
    console.log('⏳ [Socket] Trạng thái: Đang kết nối...');

    // Connect to socket with error handling
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
    });
    setSocket(newSocket);

    // Helper function to extract data from wrapper (if exists)
    const extractEventData = (payload: any) => {
      // Backend may send { type, data, timestamp } or just data directly
      if (payload && typeof payload === 'object' && 'data' in payload && 'type' in payload) {
        return payload.data;
      }
      return payload;
    };

    // Register event listeners BEFORE connecting to ensure they're ready
    // 1. new_prescription_patient: Có bệnh nhân mới với prescription
    newSocket.on('new_prescription_patient', (payload) => {
      const data = extractEventData(payload);
      console.log('[DOCTOR SOCKET] ✅ RECEIVED new_prescription_patient - Full payload:', payload);
      console.log('[DOCTOR SOCKET] new_prescription_patient - Extracted data:', data);
      console.log('[DOCTOR SOCKET] Patient:', data.patientName, `(${data.patientProfileId})`);
      console.log('[DOCTOR SOCKET] Prescription:', data.prescriptionCode);
      console.log('[DOCTOR SOCKET] Services:', data.services?.length || data.serviceIds?.length || 0, 'services');
      console.log('[DOCTOR SOCKET] Timestamp:', payload.timestamp || data.timestamp);
      
      toast.info(`🔔 Có bệnh nhân mới: ${data.patientName} (${data.prescriptionCode})`);
      // Reload queue when new patient arrives
      serviceProcessingService.getWaitingQueue().then(setQueue).catch(console.error);
    });

    // 2. patient_action: Bệnh nhân được gọi hoặc bỏ qua
    newSocket.on('patient_action', (payload) => {
      const data = extractEventData(payload);
      console.log('[DOCTOR SOCKET] ✅ RECEIVED patient_action - Full payload:', payload);
      console.log('[DOCTOR SOCKET] patient_action - Extracted data:', data);
      console.log('[DOCTOR SOCKET] Patient:', data.patientName, `(${data.patientProfileId})`);
      console.log('[DOCTOR SOCKET] Action:', data.action);
      console.log('[DOCTOR SOCKET] Prescription:', data.prescriptionCode);
      console.log('[DOCTOR SOCKET] Current Patient:', data.currentPatient);
      console.log('[DOCTOR SOCKET] Next Patient:', data.nextPatient);
      console.log('[DOCTOR SOCKET] Preparing Patient:', data.preparingPatient);
      console.log('[DOCTOR SOCKET] Timestamp:', payload.timestamp || data.timestamp);
      
      if (data.action === 'CALLED') {
        toast.info(`📢 Bệnh nhân đã được gọi: ${data.patientName}`);
      } else if (data.action === 'SKIPPED') {
        toast.warning(`⏭️ Bệnh nhân đã bị bỏ qua: ${data.patientName}`);
      }
      
      // Reload queue when patient action occurs
      serviceProcessingService.getWaitingQueue().then(setQueue).catch(console.error);
    });

    // 3. patient_status_changed: Trạng thái bệnh nhân thay đổi
    // Try both lowercase and uppercase event names
    const handlePatientStatusChanged = (payload: any) => {
      console.log('[DOCTOR SOCKET] 🎯 LISTENER TRIGGERED: patient_status_changed');
      console.log('[DOCTOR SOCKET] Raw payload type:', typeof payload);
      console.log('[DOCTOR SOCKET] Raw payload:', payload);
      
      const data = extractEventData(payload);
      console.log('[DOCTOR SOCKET] ✅ RECEIVED patient_status_changed - Full payload:', payload);
      console.log('[DOCTOR SOCKET] patient_status_changed - Extracted data:', data);
      
      if (!data || !data.patientName) {
        console.error('[DOCTOR SOCKET] ⚠️ WARNING: Invalid data structure!', data);
        return;
      }
      
      console.log('[DOCTOR SOCKET] Patient:', data.patientName, `(${data.patientProfileId})`);
      console.log('[DOCTOR SOCKET] Status change:', data.oldStatus, '→', data.newStatus);
      console.log('[DOCTOR SOCKET] Prescription:', data.prescriptionCode);
      console.log('[DOCTOR SOCKET] Timestamp:', payload.timestamp || data.timestamp);
      
      // Reload queue when patient status changes (no toast to avoid spam)
      serviceProcessingService.getWaitingQueue().then(setQueue).catch(console.error);
    };

    newSocket.on('patient_status_changed', handlePatientStatusChanged);
    // Also try uppercase version in case backend sends it that way
    newSocket.on('PATIENT_STATUS_CHANGED', handlePatientStatusChanged);

    console.log('✅ [Socket] Event listeners đã được đăng ký: new_prescription_patient, patient_action, patient_status_changed');

    // Debug: Add a catch-all listener to see ALL incoming events
    // This will help us debug if events are being received but not handled
    (newSocket as any).onAny((eventName: string, ...args: any[]) => {
      console.log('🔍 [Socket DEBUG] ════════════════════════════════════');
      console.log('🔍 [Socket DEBUG] Received ANY event:', eventName);
      console.log('🔍 [Socket DEBUG] Args:', args);
      console.log('🔍 [Socket DEBUG] Args length:', args.length);
      if (args.length > 0) {
        try {
          console.log('🔍 [Socket DEBUG] First arg:', JSON.stringify(args[0], null, 2));
        } catch (e) {
          console.log('🔍 [Socket DEBUG] First arg (cannot stringify):', args[0]);
        }
      }
      console.log('🔍 [Socket DEBUG] ════════════════════════════════════');
    });

    // Also try listening to common variations of the event name
    const tryListenToEvent = (eventName: string) => {
      newSocket.on(eventName, (data: any) => {
        console.log(`🔍 [Socket DEBUG] ✅ Received event with name: ${eventName}`, data);
      });
    };

    // Try all possible event name variations
    tryListenToEvent('patient_status_changed');
    tryListenToEvent('PATIENT_STATUS_CHANGED');
    tryListenToEvent('patient-status-changed');
    tryListenToEvent('PATIENT-STATUS-CHANGED');
    tryListenToEvent('patientStatusChanged');
    tryListenToEvent('PatientStatusChanged');

    // Log connection state changes
    newSocket.on('connecting', () => {
      console.log('🔄 [Socket] Đang kết nối... (connecting event)');
    });

    // Handle connection errors gracefully
    newSocket.on('connect_error', (error) => {
      console.error('❌ [Socket] LỖI kết nối:', error.message);
      console.error('📍 [Socket] URL thất bại:', socketUrl);
      console.error('❌ [Socket] Trạng thái: Kết nối thất bại');
      // Don't show error toast, just log it
    });

    newSocket.on('connect', () => {
      // Verify connection is actually established
      if (!newSocket.connected) {
        console.error('⚠️ [Socket] WARNING: connect event fired but socket.connected is false!');
        return;
      }

      const socketId = newSocket.id;
      if (!socketId) {
        console.error('⚠️ [Socket] WARNING: connect event fired but socket.id is missing!');
        return;
      }

      const transport = newSocket.io.engine.transport.name;
      // Extract namespace from URL (everything after the base URL)
      const namespace = socketUrl.includes('/') && socketUrl.split('/').length > 3 
        ? '/' + socketUrl.split('/').slice(3).join('/')
        : '/';
      
      console.log('✅ [Socket] Đã kết nối thành công!');
      console.log('✅ [Socket] socket.connected =', newSocket.connected);
      console.log('📍 [Socket] URL:', socketUrl);
      console.log('🆔 [Socket] Socket ID:', socketId);
      console.log('🚀 [Socket] Transport:', transport);
      console.log('📡 [Socket] Namespace:', namespace);
      console.log('👨‍⚕️ [Socket] Doctor ID:', user.id);
      console.log('🏥 [Socket] Room: doctor_room (doctorId: ' + user.id + ')');
      console.log('✅ [Socket] Trạng thái: Đã kết nối và sẵn sàng');
      
      toast.success('Đã kết nối Socket.IO - Đang lắng nghe cập nhật realtime');
      // Join doctor room only after successful connection
      newSocket.emit('join_doctor', { doctorId: user.id });
      console.log('📤 [Socket] Emitted join_doctor with doctorId:', user.id);
      // Show notification that we're listening (don't wait for server confirmation)
      toast.info('Đã tham gia phòng bác sĩ - Sẵn sàng nhận thông báo');
    });

    // Listen for successful room join confirmation (if server sends it)
    newSocket.on('joined_doctor', (data) => {
      console.log('✅ [Socket] Server xác nhận đã tham gia phòng bác sĩ');
      console.log('📥 [Socket] Server response:', data);
      console.log('👨‍⚕️ [Socket] Doctor ID:', user.id);
      console.log('🔍 [Socket DEBUG] Expected room: doctor:' + user.id);
      console.log('🔍 [Socket DEBUG] Socket ID:', newSocket.id);
      console.log('🔍 [Socket DEBUG] Socket connected:', newSocket.connected);
      
      // After joining room, verify we can receive events
      // Try emitting a test event to see if room join worked
      console.log('🔍 [Socket DEBUG] Room join confirmed. Waiting for events...');
      console.log('🔍 [Socket DEBUG] All registered listeners:', (newSocket as any)._callbacks || 'N/A');
      
      // Server confirmed join - this is optional, we already showed notification on connect
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ [Socket] Đã ngắt kết nối');
      console.log('📍 [Socket] URL:', socketUrl);
      console.log('📛 [Socket] Lý do:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, show notification
        toast.warning('Mất kết nối Socket.IO - Đang thử kết nối lại...');
      }
    });

    // Handle reconnection success
    newSocket.on('reconnect', (attemptNumber) => {
      const socketId = newSocket.id;
      const transport = newSocket.io.engine.transport.name;
      // Extract namespace from URL (everything after the base URL)
      const namespace = socketUrl.includes('/') && socketUrl.split('/').length > 3 
        ? '/' + socketUrl.split('/').slice(3).join('/')
        : '/';
      
      console.log('🔄 [Socket] Đã kết nối lại thành công!');
      console.log('📍 [Socket] URL:', socketUrl);
      console.log('🆔 [Socket] Socket ID:', socketId);
      console.log('🚀 [Socket] Transport:', transport);
      console.log('📡 [Socket] Namespace:', namespace);
      console.log('👨‍⚕️ [Socket] Doctor ID:', user.id);
      console.log('🔢 [Socket] Reconnected after', attemptNumber, 'attempts');
      
      toast.success('Đã kết nối lại Socket.IO - Đang lắng nghe cập nhật');
      // Rejoin doctor room after reconnection
      newSocket.emit('join_doctor', { doctorId: user.id });
      console.log('📤 [Socket] Re-emitted join_doctor with doctorId:', user.id);
    });

    // Cleanup on unmount
    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
      setSocket(null);
    };
  }, [user?.id]);

  const sortByStartTime = (a: WS, b: WS) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime();

  const toggleTodaySessions = async () => {
    try {
      if (!sessionsOpen) {
        const list = await workSessionService.getTodayMyWorkSessions();
        setTodaySessions([...list].sort(sortByStartTime));
      }
    } catch (e) {
      console.error('Error loading today work sessions', e);
      toast.error('Không thể tải phiên làm việc hôm nay');
    } finally {
      setSessionsOpen((o) => !o);
    }
  };

  const findFirstApproved = (sessions: WS[]) => sessions.find(ws => ws.status === 'APPROVED');
  const getFirstStartableApproved = (sessions: WS[]) => sessions.find(ws => ws.status === 'APPROVED' && !isOverdue(ws));

  const isOverdue = (ws: WS) => new Date().getTime() > new Date(ws.endTime).getTime();

  const onStartSession = async (ws: WS) => {
    if (!window.confirm('Bạn có muốn bắt đầu phiên làm việc này không?')) return;
    try {
      setProcessingSessionId(ws.id);
      await workSessionService.updateStatus(ws.id, 'IN_PROGRESS');
      toast.success('Đã bắt đầu phiên làm việc');
      const list = await workSessionService.getTodayMyWorkSessions();
      setTodaySessions([...list].sort(sortByStartTime));
    } catch (e) {
      console.error('Start session failed', e);
      toast.error('Không thể bắt đầu phiên làm việc');
    } finally {
      setProcessingSessionId(null);
    }
  };

  const onCompleteSession = async (ws: WS) => {
    if (!window.confirm('Bạn có muốn hoàn thành phiên làm việc này không?')) return;
    try {
      setProcessingSessionId(ws.id);
      await workSessionService.updateStatus(ws.id, 'COMPLETED');
      toast.success('Đã hoàn thành phiên làm việc');
      const list = await workSessionService.getTodayMyWorkSessions();
      setTodaySessions([...list].sort(sortByStartTime));
    } catch (e) {
      console.error('Complete session failed', e);
      toast.error('Không thể hoàn thành phiên làm việc');
    } finally {
      setProcessingSessionId(null);
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

  const handleCallNextPatient = async () => {
    setCallingNext(true);
    try {
      await serviceProcessingService.callNextPatient();
      toast.success('Đã gọi bệnh nhân tiếp theo');
      // Reload queue after calling
      const q = await serviceProcessingService.getWaitingQueue();
      setQueue(q);
    } catch (error: any) {
      console.error('Error calling next patient:', error);
      toast.error(error.response?.data?.message || 'Không thể gọi bệnh nhân tiếp theo');
    } finally {
      setCallingNext(false);
    }
  };

  const handleSkipPatient = async (prescriptionId: string, serviceId: string) => {
    const skipKey = `${prescriptionId}-${serviceId}`;
    setSkippingPatient(skipKey);
    try {
      await serviceProcessingService.skipPatient(prescriptionId, serviceId);
      toast.success('Đã bỏ qua bệnh nhân');
      // Reload queue after skipping
      const q = await serviceProcessingService.getWaitingQueue();
      setQueue(q);
    } catch (error: any) {
      console.error('Error skipping patient:', error);
      toast.error(error.response?.data?.message || 'Không thể bỏ qua bệnh nhân');
    } finally {
      setSkippingPatient(null);
    }
  };

  const handleScanPrescription = async (code?: string) => {
    const codeToScan = code || prescriptionCode.trim();
    if (!codeToScan) {
      toast.error('Vui lòng nhập mã phiếu chỉ định');
      return;
    }

    setScanning(true);
    try {
      const response = await serviceProcessingService.scanPrescription(codeToScan);
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

  // QR Scanner handlers
  const stopQrScanner = React.useCallback(async () => {
    setQrScanning(false);
    qrScanningRef.current = false;
    
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

  const handleQrText = React.useCallback(async (text: string) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    
    console.log('[QR] Raw:', text);
    const upper = trimmed.toUpperCase();
    
    // Parse mã prescription code từ format: PRE:PRE-xxx|... hoặc PRE-xxx|... hoặc PR-xxx|...
    let prescriptionCode = trimmed;
    
    // Kiểm tra nếu có format PRE:PRE-xxx hoặc PRE:PR-xxx
    if (trimmed.includes(':')) {
      const parts = trimmed.split('|');
      // Lấy phần đầu tiên (PRE:PRE-xxx)
      const firstPart = parts[0] || '';
      if (firstPart.includes(':')) {
        // Tách theo dấu : để lấy mã prescription code
        const codeParts = firstPart.split(':');
        if (codeParts.length >= 2) {
          prescriptionCode = codeParts[1].trim();
        }
      }
    } else {
      // Nếu không có format đặc biệt, lấy phần đầu trước dấu |
      const codeParts = trimmed.split('|');
      prescriptionCode = codeParts[0]?.trim() || trimmed;
    }
    
    console.log('[QR] Parsed prescription code:', prescriptionCode);
    setScanHint(`Đã quét mã: ${prescriptionCode.slice(0, 24)}${prescriptionCode.length > 24 ? '...' : ''}`);
    
    // Kiểm tra nếu mã bắt đầu bằng PRE hoặc PR
    if (!upper.startsWith('PRE') && !upper.startsWith('PR-')) {
      toast.error('Mã QR không phải mã phiếu chỉ định (PRE... hoặc PR-...)');
      setScanHint('Mã QR không đúng định dạng');
      return;
    }
    
    // Điền mã vào input
    setPrescriptionCode(prescriptionCode);
    toast.success(`Đã quét mã: ${prescriptionCode}`);
    
    // Đóng scanner sau khi quét thành công
    setTimeout(() => {
      setIsQrScannerOpen(false);
      stopQrScanner();
      
      // Tự động tìm kiếm sau khi đóng scanner
      setTimeout(async () => {
        const codeToScan = prescriptionCode;
        if (!codeToScan) {
          toast.error('Vui lòng nhập mã phiếu chỉ định');
          return;
        }

        setScanning(true);
        try {
          const response = await serviceProcessingService.scanPrescription(codeToScan);
          setPrescription(response.prescription);
          toast.success('Quét phiếu chỉ định thành công');
        } catch (error: any) {
          console.error('Error scanning prescription:', error);
          toast.error(error.response?.data?.message || 'Không thể quét phiếu chỉ định');
          setPrescription(null);
        } finally {
          setScanning(false);
        }
      }, 200); // Small delay to ensure scanner is fully closed
    }, 500);
  }, [stopQrScanner]);

  const startQrScanner = React.useCallback(async () => {
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
        setScanHint('Đang khởi động bộ quét QR...');
        
        // Stop the current video stream
        if (qrMediaStreamRef.current) {
          qrMediaStreamRef.current.getTracks().forEach(t => t.stop());
          qrMediaStreamRef.current = null;
        }
        if (qrVideoRef.current) {
          qrVideoRef.current.srcObject = null;
        }
        
        const html5QrCode = new Html5Qrcode('prescription-qr-reader');
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
  React.useEffect(() => {
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

      // Reload queue to reflect status changes
      try {
        const q = await serviceProcessingService.getWaitingQueue();
        setQueue(q);
      } catch (e) {
        console.error('Error reloading queue:', e);
      }

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

  // Handle opening results dialog from queue patient
  const handleOpenResultsDialogFromQueue = async (
    patientProfileId: string,
    prescriptionId: string,
    serviceId: string,
    serviceName: string
  ) => {
    // Create a minimal service object for the dialog
    const serviceForDialog: PrescriptionService = {
      prescriptionId,
      serviceId,
      service: {
        id: serviceId,
        name: serviceName,
        serviceCode: '',
        description: '',
        price: 0,
        timePerPatient: 0
      },
      status: 'WAITING_RESULT',
      order: 1,
      results: [],
      note: null,
      startedAt: null,
      completedAt: null
    };
    setSelectedService(serviceForDialog);
    setSelectedPatientForResults({
      patientProfileId,
      services: [{
        prescriptionId,
        serviceId,
        serviceName,
        order: 1,
        status: 'WAITING_RESULT'
      }]
    });
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
      
      // Reload queue to reflect status changes
      try {
        const q = await serviceProcessingService.getWaitingQueue();
        setQueue(q);
      } catch (e) {
        console.error('Error reloading queue:', e);
      }
      
      // Reset selected patient for results
      setSelectedPatientForResults(null);
      
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
    isFirstInQueue: _isFirstInQueue = false,
    showStartButton = true,
    showNextBadge = false,
    hideCard = false
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
    showStartButton?: boolean;
    showNextBadge?: boolean;
    hideCard?: boolean;
  }) => {
    const totalPrice = patient.services.reduce((sum, service) => sum + service.service.price, 0);
    
    // Nếu hideCard là true thì không render gì cả
    if (hideCard) {
      return null;
    }

    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
        {/* Patient Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lg">{patient.patientName}</h4>
            {showNextBadge && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Kế tiếp
              </Badge>
            )}
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
              {waitingServices.length > 0 && onQuickStart && showStartButton && (
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

        <div className="flex items-center gap-3 relative">
          <Button variant="outline" onClick={toggleTodaySessions}>
            Quản lý phiên làm việc
          </Button>
          {sessionsOpen && (
            <div className="absolute right-0 top-full mt-2 w-[28rem] max-h-96 overflow-auto bg-white border rounded-md shadow-lg z-20">
              <div className="px-4 py-2 border-b text-sm font-medium">Phiên hôm nay</div>
              {todaySessions.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500">Không có phiên làm việc nào hôm nay</div>
              ) : (
                <div className="divide-y">
                  {todaySessions.map((ws) => (
                    <div key={ws.id} className="p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{ws.booth?.room.roomName} - {ws.booth?.name}</div>
                        <Badge className="text-xs" variant={ws.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                          {ws.status === 'IN_PROGRESS' ? 'Đang diễn ra' : ws.status === 'COMPLETED' ? 'Đã xong' : ws.status === 'PENDING' ? 'Chờ duyệt' : ws.status === 'APPROVED' ? 'Đã duyệt' : ws.status === 'CANCELED' ? 'Đã hủy' : ws.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(ws.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(ws.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {ws.status === 'APPROVED' && isOverdue(ws) && (
                        <div className="text-xs text-red-600 mt-1">Phiên làm việc đã quá hạn</div>
                      )}
                      {ws.services?.length > 0 && (
                        <div className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {ws.services.map(s => s.service?.name || s.service.name).join(', ')}
                        </div>
                      )}
                      <div className="mt-2 flex gap-2">
                        {ws.status === 'APPROVED' && ws.id === getFirstStartableApproved(todaySessions)?.id && (
                          <Button size="sm" onClick={() => onStartSession(ws)} disabled={processingSessionId === ws.id}>
                            {processingSessionId === ws.id ? 'Đang xử lý...' : 'Bắt đầu'}
                          </Button>
                        )}
                        {ws.status === 'IN_PROGRESS' && (
                          <Button size="sm" variant="outline" onClick={() => onCompleteSession(ws)} disabled={processingSessionId === ws.id}>
                            {processingSessionId === ws.id ? 'Đang xử lý...' : 'Hoàn thành'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {workSession && (
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600">
                <div className="font-medium">Ca làm việc hiện tại:</div>
                <div>{workSession.booth.room.roomName} - {workSession.booth.name}</div>
              </div>
            </div>
          )}
        </div>
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
              <Label htmlFor="prescriptionCode" className="pb-2.5">Mã phiếu chỉ định</Label>
              <Input
                id="prescriptionCode"
                placeholder="VD: PR-1756995889229-26DUNT hoặc PRE-..."
                value={prescriptionCode}
                onChange={(e) => {
                  setPrescriptionCode(e.target.value);
                  // Clear prescription when input is cleared
                  if (!e.target.value.trim()) {
                    setPrescription(null);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleScanPrescription()}
              />
            </div>
            <Button
              onClick={() => setIsQrScannerOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
              title="Quét QR code"
            >
              <QrCode className="h-4 w-4" />
              Quét QR
            </Button>
            <Button
              onClick={() => handleScanPrescription()}
              disabled={scanning}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {scanning ? 'Đang tìm...' : 'Tìm kiếm'}
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

      {/* Waiting Queue (by patient) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              Hàng chờ hôm nay {queue ? `(${queue.totalCount})` : ''}
            </CardTitle>
            {queue && queue.patients.length > 0 && (
              <Button
                onClick={handleCallNextPatient}
                disabled={callingNext}
                className="flex items-center gap-2"
                size="sm"
              >
                {callingNext ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang gọi...
                  </>
                ) : (
                  <>
                    <PhoneCall className="h-4 w-4" />
                    Gọi bệnh nhân tiếp theo
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!queue || queue.patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Không có bệnh nhân trong hàng chờ</p>
            </div>
          ) : (() => {
            // Separate patients into two groups
            const normalPatients = queue.patients.filter(p => 
              p.overallStatus !== 'WAITING_RESULT' && 
              !p.services.some(s => s.status === 'WAITING_RESULT')
            );
            const waitingResultPatients = queue.patients.filter(p => 
              p.overallStatus === 'WAITING_RESULT' || 
              p.services.some(s => s.status === 'WAITING_RESULT')
            );

            // Sort normal patients: SERVING first, then PREPARING, SKIPPED, RETURNING, WAITING
            const statusOrder: Record<string, number> = {
              'SERVING': 1,
              'PREPARING': 2,
              'SKIPPED': 3,
              'RETURNING': 4,
              'WAITING': 5
            };
            normalPatients.sort((a, b) => {
              const orderA = statusOrder[a.overallStatus] || 999;
              const orderB = statusOrder[b.overallStatus] || 999;
              if (orderA !== orderB) return orderA - orderB;
              return a.queueOrder - b.queueOrder;
            });

            // Sort waiting result patients by queue order
            waitingResultPatients.sort((a, b) => a.queueOrder - b.queueOrder);

            const renderPatientCard = (p: typeof queue.patients[0]) => (
                <div key={p.patientProfileId} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                        {p.queueOrder}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{p.patientName}</div>
                        <div className="text-xs text-gray-500">{p.prescriptionCode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {p.overallStatus}
                      </Badge>
                      {/* Skip button - only show for non-WAITING_RESULT patients */}
                      {p.overallStatus !== 'WAITING_RESULT' && 
                       !p.services.some(s => s.status === 'WAITING_RESULT') &&
                       p.services.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const firstService = p.services[0];
                            handleSkipPatient(firstService.prescriptionId, firstService.serviceId);
                          }}
                          disabled={skippingPatient === `${p.services[0].prescriptionId}-${p.services[0].serviceId}`}
                          className="flex items-center gap-1 h-7 text-xs"
                        >
                          {skippingPatient === `${p.services[0].prescriptionId}-${p.services[0].serviceId}` ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              <SkipForward className="h-3 w-3" />
                              Bỏ qua
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {p.services
                      .slice()
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map(s => `${s.order ? `#${s.order} ` : ''}${s.serviceName} (${s.status})`) 
                      .join(' • ')}
                  </div>
                  
                  {/* Action buttons for SERVING patients */}
                  {p.overallStatus === 'SERVING' && p.services.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                      {p.services
                        .filter(s => s.status === 'SERVING')
                        .map((service) => {
                          const serviceKey = `${service.prescriptionId}-${service.serviceId}`;
                          const isUpdating = updatingService === serviceKey;
                          
                          return (
                            <div key={serviceKey} className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleUpdateServiceStatus(
                                    service.prescriptionId,
                                    service.serviceId,
                                    'WAITING_RESULT',
                                    'Chờ kết quả'
                                  );
                                }}
                                disabled={isUpdating}
                                className="flex items-center gap-1 h-7 text-xs"
                              >
                                {isUpdating ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                                    Đang xử lý...
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3" />
                                    Chờ kết quả
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleUpdateServiceStatus(
                                    service.prescriptionId,
                                    service.serviceId,
                                    'COMPLETED',
                                    'Hoàn thành dịch vụ'
                                  );
                                }}
                                disabled={isUpdating}
                                className="flex items-center gap-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                              >
                                {isUpdating ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Đang xử lý...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3" />
                                    Hoàn thành
                                  </>
                                )}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Action buttons for WAITING_RESULT patients */}
                  {(p.overallStatus === 'WAITING_RESULT' || p.services.some(s => s.status === 'WAITING_RESULT')) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {(() => {
                        const waitingResultServices = p.services.filter(s => s.status === 'WAITING_RESULT');
                        
                        // If only one service, show button directly
                        if (waitingResultServices.length === 1) {
                          const service = waitingResultServices[0];
                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                handleOpenResultsDialogFromQueue(
                                  p.patientProfileId,
                                  service.prescriptionId,
                                  service.serviceId,
                                  service.serviceName
                                );
                              }}
                              className="flex items-center gap-1 h-7 text-xs w-full"
                            >
                              <FileCheck className="h-3 w-3" />
                              Cập nhật kết quả
                            </Button>
                          );
                        }
                        
                        // If multiple services, show dropdown + button
                        return (
                          <div className="space-y-2">
                            <Select
                              value={selectedPatientForResults?.patientProfileId === p.patientProfileId 
                                ? `${selectedPatientForResults.services[0]?.prescriptionId}-${selectedPatientForResults.services[0]?.serviceId}`
                                : undefined
                              }
                              onValueChange={(value) => {
                                const [prescriptionId, serviceId] = value.split('-');
                                const service = waitingResultServices.find(
                                  s => s.prescriptionId === prescriptionId && s.serviceId === serviceId
                                );
                                if (service) {
                                  setSelectedPatientForResults({
                                    patientProfileId: p.patientProfileId,
                                    services: [service]
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Chọn dịch vụ cần cập nhật kết quả" />
                              </SelectTrigger>
                              <SelectContent>
                                {waitingResultServices.map((service) => (
                                  <SelectItem 
                                    key={`${service.prescriptionId}-${service.serviceId}`}
                                    value={`${service.prescriptionId}-${service.serviceId}`}
                                  >
                                    {service.order ? `#${service.order} ` : ''}{service.serviceName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const selected = selectedPatientForResults?.patientProfileId === p.patientProfileId
                                  ? selectedPatientForResults.services[0]
                                  : null;
                                if (selected) {
                                  handleOpenResultsDialogFromQueue(
                                    p.patientProfileId,
                                    selected.prescriptionId,
                                    selected.serviceId,
                                    selected.serviceName
                                  );
                                } else {
                                  toast.error('Vui lòng chọn dịch vụ cần cập nhật kết quả');
                                }
                              }}
                              disabled={selectedPatientForResults?.patientProfileId !== p.patientProfileId}
                              className="flex items-center gap-1 h-7 text-xs w-full"
                            >
                              <FileCheck className="h-3 w-3" />
                              Cập nhật kết quả
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
            );

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Normal patients (SERVING, PREPARING, SKIPPED, RETURNING, WAITING) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="text-xs">Hàng chờ thường</Badge>
                    <span className="text-xs text-gray-500">({normalPatients.length})</span>
                  </div>
                  {normalPatients.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      Không có bệnh nhân
                    </div>
                  ) : (
                    normalPatients.map(renderPatientCard)
                  )}
                </div>

                {/* Column 2: Waiting result patients */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-800">Chờ kết quả</Badge>
                    <span className="text-xs text-gray-500">({waitingResultPatients.length})</span>
                  </div>
                  {waitingResultPatients.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      Không có bệnh nhân chờ kết quả
                    </div>
                  ) : (
                    waitingResultPatients.map(renderPatientCard)
                  )}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Update Results Dialog */}
      {selectedService && (
        <UpdateResultsDialog
          open={resultsDialogOpen}
          onOpenChange={setResultsDialogOpen}
          service={selectedService}
          patientProfileId={selectedPatientForResults?.patientProfileId || 
                           (selectedService as any).prescription?.patientProfile?.id ||
                           (selectedService as any).patientProfileId}
          onUpdate={handleResultsUpdate}
        />
      )}

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
                className="w-full h-full object-cover hidden"
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* HTML5 QR Code reader container */}
              <div id="prescription-qr-reader" className="w-full h-full"></div>
              
              {/* Scanning overlay for BarcodeDetector mode */}
              {qrScanning && qrHtml5QrCodeRef.current === null && (
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
