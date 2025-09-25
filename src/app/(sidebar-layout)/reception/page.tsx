'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Users, UserCheck, Clock, Play, Square, SkipForward, RefreshCw, AlertCircle, User, MapPin } from 'lucide-react';
import { useReception } from '@/lib/hooks/useReception';

export default function ReceptionPage() {
  const {
    counters,
    currentCounter,
    loadingCounters,
    queue,
    currentPatient,
    nextPatient,
    loadingQueue,
    loadingAction,
    refreshCounters,
    refreshQueue,
    openCounter,
    closeCounter,
    callNextPatient,
    skipCurrentPatient,
  } = useReception();

  const [openNotes, setOpenNotes] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'PREPARING': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'CALLED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SERVING': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'MISSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleOpenCounter = async () => {
    if (!selectedCounter) return;
    const ok = await openCounter(selectedCounter, openNotes);
    if (ok) {
      setShowOpenDialog(false);
      setOpenNotes('');
      setSelectedCounter(null);
    }
  };

  const handleCloseCounter = async () => {
    const ok = await closeCounter(closeNotes);
    if (ok) {
      setShowCloseDialog(false);
      setCloseNotes('');
    }
  };

  return (
    <div className="px-8 py-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Màn hình tiếp nhận</h1>
          <p className="text-gray-600 mt-1">Quản lý quầy và hàng chờ bệnh nhân</p>
        </div>
        <Button onClick={() => { refreshCounters(); refreshQueue(); }} disabled={loadingCounters || loadingQueue} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingCounters || loadingQueue ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                Quản lý quầy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentCounter ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-800">Quầy đang hoạt động</h3>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Hoạt động</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-green-700">
                    <p className="flex items-center gap-2"><User className="h-4 w-4" />{currentCounter.counterName} ({currentCounter.counterCode})</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{/* optional location */}</p>
                    <p className="flex items-center gap-2"><Clock className="h-4 w-4" />Bắt đầu: {new Date(currentCounter.currentAssignment.assignedAt).toLocaleTimeString('vi-VN')}</p>
                  </div>
                  <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full mt-4" disabled={loadingAction}>
                        <Square className="h-4 w-4 mr-2" />
                        Đóng quầy
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Đóng quầy</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="close-notes">Ghi chú (tùy chọn)</Label>
                          <Textarea id="close-notes" placeholder="Nhập ghi chú..." value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCloseDialog(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={handleCloseCounter} disabled={loadingAction}>{loadingAction ? 'Đang xử lý...' : 'Đóng quầy'}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Chưa có quầy hoạt động</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Chọn quầy để bắt đầu phiên làm việc</p>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Quầy có sẵn</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loadingCounters ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500 mt-1">Đang tải...</p>
                    </div>
                  ) : counters.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Không có quầy nào</p>
                  ) : (
                    counters.map((counter, idx) => (
                      <div key={`${counter.id || counter.counterCode || 'ctr'}-${idx}`} className={`p-3 border rounded-lg cursor-pointer transition-colors ${counter.currentAssignment ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`} onClick={() => { if (!counter.currentAssignment && !currentCounter) { setSelectedCounter(counter.id); setShowOpenDialog(true); } }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{counter.counterName} ({counter.counterCode})</p>
                          </div>
                          <Badge variant="outline" className={counter.currentAssignment ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}>
                            {counter.currentAssignment ? 'Đang sử dụng' : 'Trống'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mở quầy</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="open-notes">Ghi chú (tùy chọn)</Label>
                      <Textarea id="open-notes" placeholder="Nhập ghi chú..." value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowOpenDialog(false)}>Hủy</Button>
                    <Button onClick={handleOpenCounter} disabled={loadingAction || !selectedCounter}>{loadingAction ? 'Đang xử lý...' : 'Mở quầy'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-gray-600" />
                Bệnh nhân hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPatient ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getStatusColor(currentPatient.status)}>
                      {currentPatient.status}
                    </Badge>
                    <Badge variant="outline">{String(currentPatient.priorityLevel)}</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-900">{currentPatient.patientName}</p>
                    <p className="text-sm text-gray-600">Tuổi: {currentPatient.patientAge}</p>
                    <p className="text-sm font-medium text-blue-600">Số thứ tự: {currentPatient.queueNumber}</p>
                    <p className="text-xs text-gray-500">Thời gian chờ dự kiến: {currentPatient.estimatedWaitTime ?? '-'} phút</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Chưa có bệnh nhân nào</p>
                </div>
              )}

              <Separator />

              {nextPatient && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Bệnh nhân tiếp theo:</p>
                  <p className="text-sm text-yellow-700">{nextPatient.patientName}</p>
                  <p className="text-xs text-yellow-600">Số: {nextPatient.queueNumber}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Button onClick={callNextPatient} disabled={!currentCounter || loadingAction || loadingQueue} className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  {loadingAction ? 'Đang gọi...' : 'Gọi bệnh nhân tiếp theo'}
                </Button>

                {currentPatient && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={skipCurrentPatient} disabled={loadingAction} variant="outline" size="sm">
                      <SkipForward className="h-4 w-4 mr-1" />
                      Bỏ qua
                    </Button>
                    <div />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                Hàng chờ ({queue.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingQueue ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
                </div>
              ) : queue.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Hàng chờ trống</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {queue.map((patient, index) => (
                    <div key={`${patient.ticketId || 'tkt'}-${index}`} className={`p-3 border rounded-lg ${patient.status === 'CALLED' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{index + 1}. {patient.patientName}</span>
                        <Badge variant="outline" className={getStatusColor(patient.status)}>{patient.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Số: {patient.queueNumber}</span>
                        <span>Tuổi: {patient.patientAge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


