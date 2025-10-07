"use client";

import {  useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { DollarSign, Clock, FileText } from 'lucide-react';
import { Service } from '@/lib/types/appointment-booking';

export function SelectServiceStep() {
  const {
    selectedDoctor,
    selectedDate,
    availableServices,
    loading,
    selectService,
    loadDoctorServices,
  } = useAppointmentBookingContext();

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      console.log('[STEP] SelectServiceStep → loadDoctorServices', { doctorId: selectedDoctor.doctorId, date: selectedDate });
      loadDoctorServices(selectedDoctor.doctorId, selectedDate);
    } else {
      console.log('[STEP] SelectServiceStep → waiting', { hasDoctor: !!selectedDoctor, hasDate: !!selectedDate });
    }
  }, [selectedDoctor, selectedDate, loadDoctorServices]);

  const handleSelectService = (service: Service) => {
    selectService(service);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableServices.map((service) => (
          <Card
            key={service.serviceId}
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-primary/50"
            onClick={() => handleSelectService(service)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.serviceName}</CardTitle>
                  <CardDescription className="text-sm">
                    {service.serviceCode}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-lg font-semibold text-green-600">
                    {formatPrice(service.price)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <Badge variant="secondary" className="text-xs">
                    {service.timePerPatient} phút
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mt-2">{service.description}</p>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectService(service);
                  }}
                >
                  Chọn
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {availableServices.length === 0 && !loading && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Không có dịch vụ nào khả dụng</p>
        </div>
      )}
    </div>
  );
}
