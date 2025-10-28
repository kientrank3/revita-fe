'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Save, X, AlertTriangle, CheckCircle, Search, Loader2 } from 'lucide-react';
import { WorkSessionFormData, WorkSession } from '@/lib/types/work-session';
import { useServices } from '@/lib/hooks/useServices';

interface WorkSessionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkSessionFormData) => Promise<void>;
  editingSession?: WorkSession | null;
  selectedDate?: Date;
  loading?: boolean;
}

export function WorkSessionForm({
  isOpen,
  onClose,
  onSubmit,
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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use services hook to fetch services from API
  const { 
    services, 
    loading: servicesLoading, 
    error: servicesError, 
    total: totalServices,
    filterServices 
  } = useServices();

  // Initialize form data
  useEffect(() => {
    if (editingSession) {
      const start = new Date(editingSession.startTime);
      const end = new Date(editingSession.endTime);
      
      setFormData({
        // Use local date to avoid timezone shifting the selected day
        date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        serviceIds: editingSession.services.map(s => s.id),
      });
    } else if (selectedDate) {
      setFormData({
        // Use local date to avoid timezone shifting the selected day
        date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Filter services immediately (client-side)
    filterServices(query);
  };

  const selectedServices = (services || []).filter(s => formData.serviceIds.includes(s.id));
  const availableServices = (services || []).filter(s => !formData.serviceIds.includes(s.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col border-0 shadow-2xl bg-white">
        <DialogHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 -m-6 p-6 mb-0 flex-shrink-0">
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

        <div className="flex-1  p-6 pt-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="h-full flex flex-col ">
            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 flex-shrink-0">
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex-shrink-0">
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
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4 flex-shrink-0">
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
                {servicesError && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {servicesError}
                  </p>
                )}
              </div>

              {/* Search Services */}
              <div className="relative mb-4 flex-shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                  disabled={servicesLoading}
                />
              </div>

              {/* Selected Services - Compact Display */}
              {selectedServices.length > 0 && (
                <div className="mb-4 flex-shrink-0">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Đã chọn {selectedServices.length} dịch vụ
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedServices.map((service) => (
                        <div
                          key={service.id}
                          className="inline-flex items-center gap-1 bg-white border border-green-300 rounded-md px-2 py-1 text-xs"
                        >
                          <span className="font-medium">{service.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleServiceToggle(service.id, false)}
                            className="h-4 w-4 p-0 hover:bg-red-100 rounded-full"
                          >
                            <X className="h-3 w-3 text-gray-500 hover:text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Available Services - Scrollable List */}
              <div className="flex-1 h-52">
                <div className="h-full border border-gray-200 rounded-lg flex flex-col">
                  <div className="flex-shrink-0 p-3 bg-gray-50 border-b">
                    <h3 className="text-sm font-medium">
                      Dịch vụ có sẵn 
                      {!servicesLoading && ` (${availableServices.length}${searchQuery ? ` / ${totalServices}` : ''})`}
                    </h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {servicesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Đang tải dịch vụ...</span>
                        </div>
                      </div>
                    ) : servicesError ? (
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">Không thể tải danh sách dịch vụ</span>
                        </div>
                      </div>
                    ) : availableServices.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 text-gray-300" />
                          <span className="text-sm">
                            {searchQuery ? 'Không tìm thấy dịch vụ phù hợp' : 'Không có dịch vụ nào'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2">
                        <div className="space-y-1">
                          {availableServices.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center space-x-3 p-2 border rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              <Checkbox
                                id={service.id}
                                checked={formData.serviceIds.includes(service.id)}
                                onCheckedChange={(checked) => 
                                  handleServiceToggle(service.id, checked as boolean)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <Label
                                  htmlFor={service.id}
                                  className="font-medium cursor-pointer text-sm block truncate"
                                >
                                  {service.name}
                                </Label>
                                <p className="text-xs text-muted-foreground truncate">
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-4 flex-shrink-0">
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
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
