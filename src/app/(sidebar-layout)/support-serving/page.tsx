"use client";

import { useCallback, useMemo, useState } from 'react';
import { receptionService, type PendingServicesResponse, type AssignNextServiceResponse } from '@/lib/services/reception.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

export default function SupportServingPage() {
  const [prescriptionCode, setPrescriptionCode] = useState<string>("");
  const [pendingData, setPendingData] = useState<PendingServicesResponse | null>(null);
  const [assignResult, setAssignResult] = useState<AssignNextServiceResponse | null>(null);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const [loadingAssign, setLoadingAssign] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const canQuery = useMemo(() => prescriptionCode.trim().length > 0, [prescriptionCode]);

  const handleFetchPending = useCallback(async () => {
    if (!canQuery) return;
    setError("");
    setAssignResult(null);
    setLoadingPending(true);
    try {
      const data = await receptionService.getPendingServices(prescriptionCode.trim());
      setPendingData(data);
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message || 'Không thể lấy thông tin phiếu chỉ định';
      setPendingData(null);
      setError(message);
    } finally {
      setLoadingPending(false);
    }
  }, [canQuery, prescriptionCode]);

  const handleAssignNext = useCallback(async () => {
    if (!pendingData?.prescriptionCode) return;
    setError("");
    setLoadingAssign(true);
    try {
      const res = await receptionService.assignNextService({ prescriptionCode: pendingData.prescriptionCode });
      setAssignResult(res);
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
  }, [pendingData?.prescriptionCode]);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Quầy hỗ trợ thực hiện dịch vụ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                placeholder="Nhập mã phiếu chỉ định"
                value={prescriptionCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrescriptionCode(e.target.value)}
              />
            </div>
            <Button onClick={handleFetchPending} disabled={!canQuery || loadingPending}>
              {loadingPending ? 'Đang tải...' : 'Xem dịch vụ chờ'}
            </Button>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {pendingData && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Mã phiếu: <span className="font-medium text-foreground">{pendingData.prescriptionCode}</span> · Trạng thái: {pendingData.status} · Tổng dịch vụ chờ: {pendingData.totalCount}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Danh sách dịch vụ PENDING</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Tên dịch vụ</TableHead>
                        <TableHead>Service ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingData.services.map((s: { serviceId: string; serviceName: string }, idx: number) => (
                        <TableRow key={s.serviceId}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{s.serviceName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.serviceId}</TableCell>
                        </TableRow>
                      ))}
                      {pendingData.services.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                            Không có dịch vụ PENDING
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2">
                <Button onClick={handleAssignNext} disabled={loadingAssign || pendingData.totalCount === 0}>
                  {loadingAssign ? 'Đang gán...' : 'Gán dịch vụ tiếp theo'}
                </Button>
                <span className="text-xs text-muted-foreground">Gán dịch vụ có thứ tự nhỏ nhất cho phiên làm việc phù hợp</span>
              </div>

              {assignResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Kết quả gán</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      Đã chuyển dịch vụ <span className="font-medium">{assignResult.assignedService.serviceId}</span> sang trạng thái <span className="font-medium">{assignResult.assignedService.status}</span>
                    </div>
                    <Separator />
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
    </div>
  );
}


