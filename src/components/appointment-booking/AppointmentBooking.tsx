"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppointmentBookingContext, AppointmentBookingProvider } from '@/lib/contexts/AppointmentBookingContext';
import { BookingFlow, BOOKING_STEPS } from '@/lib/types/appointment-booking';
import { SelectSpecialtyStep } from '@/components/appointment-booking/SelectSpecialtyStep';
import { SelectDateStep } from '@/components/appointment-booking/SelectDateStep';
import { SelectDoctorStep } from '@/components/appointment-booking/SelectDoctorStep';
import { SelectServiceStep } from '@/components/appointment-booking/SelectServiceStep';
import { SelectTimeStep } from '@/components/appointment-booking/SelectTimeStep';
import { ConfirmBookingStep } from '@/components/appointment-booking/ConfirmBookingStep';
import { ChevronLeft, CheckCircle, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

function AppointmentBookingInner() {
  const {
    currentStep,
    bookingFlow,
    prevStep,
    setBookingFlowType,
    error,
    success,
    resetBooking,
    selectedSpecialty,
    selectedDoctor,
    selectedDate,
    selectedService,
    selectedTimeSlot,
  } = useAppointmentBookingContext();

  // Show success/error messages
  if (success) {
    toast.success(success);
  }
  if (error) {
    toast.error(error);
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <SelectSpecialtyStep />;
      case 2:
        if (bookingFlow === 'BY_DATE') return <SelectDateStep />;
        if (bookingFlow === 'BY_DOCTOR') return <SelectDoctorStep />;
        return null;
      case 3:
        if (bookingFlow === 'BY_DATE') return <SelectDoctorStep />;
        if (bookingFlow === 'BY_DOCTOR') return <SelectDateStep />;
        return null;
      case 4:
        if (bookingFlow === 'BY_DATE') return <SelectServiceStep />;
        if (bookingFlow === 'BY_DOCTOR') return <SelectServiceStep />;
        return null;
      case 5:
        if (bookingFlow === 'BY_DATE') return <SelectTimeStep />;
        if (bookingFlow === 'BY_DOCTOR') return <SelectTimeStep />;
        return null;
      case 6: return <ConfirmBookingStep />;
      default: return <SelectSpecialtyStep />;
    }
  };

  const getStepTitle = () => {
    const step = BOOKING_STEPS.find(s => s.id === currentStep);
    return step ? step.name : 'Đặt lịch khám';
  };

  const getStepDescription = () => {
    const step = BOOKING_STEPS.find(s => s.id === currentStep);
    return step ? step.description : '';
  };

  const canGoBack = currentStep > 1;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Đặt lịch khám bệnh
        </h1>
        <p className="text-lg text-gray-600">
          Chọn chuyên khoa, bác sĩ và thời gian phù hợp với bạn
        </p>
      </div>

      {/* Booking Flow Selection */}
      {currentStep === 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Chọn cách đặt lịch</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={bookingFlow} onValueChange={(value) => setBookingFlowType(value as BookingFlow)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="BY_DATE" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Theo ngày</span>
                </TabsTrigger>
                <TabsTrigger value="BY_DOCTOR" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Theo bác sĩ</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="BY_DATE" className="mt-4">
                <p className="text-sm text-gray-600">
                  Chọn chuyên khoa → Chọn bác sĩ → Chọn ngày → Chọn dịch vụ → Chọn giờ
                </p>
              </TabsContent>
              <TabsContent value="BY_DOCTOR" className="mt-4">
                <p className="text-sm text-gray-600">
                  Chọn chuyên khoa → Chọn bác sĩ → Chọn ngày → Chọn dịch vụ → Chọn giờ
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Progress Steps */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {BOOKING_STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const isAccessible = step.id <= currentStep + 1;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-primary text-white'
                            : isAccessible
                              ? 'bg-gray-200 text-gray-600'
                              : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className={`text-xs mt-1 text-center ${
                      isActive ? 'text-primary font-medium' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {index < BOOKING_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Bước {currentStep}: {getStepTitle()}</span>
            {currentStep > 1 && (
              <Badge variant="outline">
                {bookingFlow === 'BY_DATE' ? 'Theo ngày' : 'Theo bác sĩ'}
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600">{getStepDescription()}</p>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={!canGoBack}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Button>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={resetBooking}
          >
            Bắt đầu lại
          </Button>
        </div>
      </div>

      {/* Selected Information Summary */}
      {(selectedSpecialty || selectedDoctor || selectedDate || selectedService || selectedTimeSlot) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Thông tin đã chọn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {selectedSpecialty && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">Chuyên khoa</p>
                  <p className="font-medium">{selectedSpecialty.name}</p>
                </div>
              )}
              {selectedDoctor && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">Bác sĩ</p>
                  <p className="font-medium">{selectedDoctor.doctorName}</p>
                </div>
              )}
              {selectedDate && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">Ngày</p>
                  <p className="font-medium">
                    {new Date(selectedDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
              {selectedService && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">Dịch vụ</p>
                  <p className="font-medium">{selectedService.serviceName}</p>
                </div>
              )}
              {selectedTimeSlot && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">Giờ</p>
                  <p className="font-medium">
                    {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function AppointmentBooking() {
  return (
    <AppointmentBookingProvider>
      <AppointmentBookingInner />
    </AppointmentBookingProvider>
  );
}
