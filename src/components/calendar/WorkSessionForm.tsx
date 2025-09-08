'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Save, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { WorkSessionFormData, Service, WorkSession } from '@/lib/types/work-session';

interface WorkSessionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkSessionFormData) => Promise<void>;
  services: Service[];
  editingSession?: WorkSession | null;
  selectedDate?: Date;
  loading?: boolean;
}

export function WorkSessionForm({
  isOpen,
  onClose,
  onSubmit,
  services = [],
  editingSession,
  selectedDate,
  loading = false,
}: WorkSessionFormProps) {
  const [formData, setFormData] = useState<WorkSessionFormData>({
    date: '',
    startTime: '',
    endTime: '',
    serviceIds: [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (editingSession) {
      const start = new Date(editingSession.startTime);
      const end = new Date(editingSession.endTime);
      
      setFormData({
        date: start.toISOString().split('T')[0],
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        serviceIds: editingSession.services.map(s => s.id),
      });
    } else if (selectedDate) {
      setFormData({
        date: selectedDate.toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '12:00',
        serviceIds: [],
      });
    }
  }, [editingSession, selectedDate, isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        serviceIds: [],
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Vui lòng chọn thời gian bắt đầu';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Vui lòng chọn thời gian kết thúc';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`${formData.date}T${formData.startTime}`);
      const end = new Date(`${formData.date}T${formData.endTime}`);
      
      if (end <= start) {
        newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }

      // Check if session is too short (minimum 30 minutes)
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      if (duration < 30) {
        newErrors.endTime = 'Ca làm việc tối thiểu 30 phút';
      }
    }

    if (formData.serviceIds.length === 0) {
      newErrors.serviceIds = 'Vui lòng chọn ít nhất một dịch vụ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: checked
        ? [...prev.serviceIds, serviceId]
        : prev.serviceIds.filter(id => id !== serviceId),
    }));
  };

  const selectedServices = (services || []).filter(s => formData.serviceIds.includes(s.id));
  const availableServices = (services || []).filter(s => !formData.serviceIds.includes(s.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-none border-0 shadow-2xl bg-white">
        <DialogHeader className="pb-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 -m-6 p-6 mb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-full bg-gradient-to-r bg-primary text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                {editingSession ? 'Cập nhật lịch làm việc' : 'Tạo lịch làm việc mới'}
              </h2>
              <DialogDescription className="text-gray-600 mt-1">
                {editingSession 
                  ? 'Chỉnh sửa thông tin lịch làm việc hiện tại'
                  : 'Tạo lịch làm việc mới cho bác sĩ'
                }
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Ngày làm việc</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Giờ bắt đầu</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className={errors.startTime ? 'border-red-500' : ''}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.startTime}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Giờ kết thúc</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className={errors.endTime ? 'border-red-500' : ''}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Session Duration Info */}
          {formData.startTime && formData.endTime && !errors.endTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Thời lượng ca làm việc:</span>
                <span>
                  {(() => {
                    const start = new Date(`${formData.date}T${formData.startTime}`);
                    const end = new Date(`${formData.date}T${formData.endTime}`);
                    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                    const hours = Math.floor(duration / 60);
                    const minutes = duration % 60;
                    return `${hours}h ${minutes}m`;
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Service Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Dịch vụ thực hiện</Label>
              <p className="text-sm text-muted-foreground">
                Chọn các dịch vụ sẽ thực hiện trong ca làm việc này
              </p>
              {errors.serviceIds && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.serviceIds}
                </p>
              )}
            </div>

            {/* Selected Services */}
            {selectedServices.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-700">
                    Dịch vụ đã chọn ({selectedServices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.serviceCode}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleServiceToggle(service.id, false)}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Services */}
            {availableServices.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Dịch vụ có sẵn ({availableServices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {availableServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          id={service.id}
                          checked={formData.serviceIds.includes(service.id)}
                          onCheckedChange={(checked) => 
                            handleServiceToggle(service.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={service.id}
                            className="font-medium cursor-pointer"
                          >
                            {service.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {service.serviceCode}
                            {service.description && ` • ${service.description}`}
                          </p>
                          {service.timePerPatient && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {service.timePerPatient} phút/bệnh nhân
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang xử lý...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {editingSession ? 'Cập nhật' : 'Tạo lịch'}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
