"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export function SelectDateStep() {
  const {
    selectedSpecialty,
    selectedDoctor,
    workingDays,
    loading,
    selectDate,
    loadAvailableDoctors,
    loadDoctorWorkingDays,
    bookingFlow
  } = useAppointmentBookingContext();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatMonth = (date: Date) => {
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString();
    return `${m}/${y}`;
  };

  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Load doctor's working days for BY_DOCTOR flow
  useEffect(() => {
    if (bookingFlow === 'BY_DOCTOR' && selectedDoctor) {
      const month = formatMonth(currentMonth);
      console.log('[STEP] SelectDateStep → loadDoctorWorkingDays', { doctorId: selectedDoctor.doctorId, month });
      loadDoctorWorkingDays(selectedDoctor.doctorId, month);
    }
  }, [bookingFlow, selectedDoctor, currentMonth, loadDoctorWorkingDays]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Use local date format to avoid timezone shifting the day
      const dateString = formatLocalDate(date);
      const isCurrentMonth = date.getMonth() === month;
      const isPast = date < today;
      const isWorkingDay = workingDays.includes(dateString);
      const isToday = date.toDateString() === today.toDateString();

      days.push({
        date,
        dateString,
        isCurrentMonth,
        isPast,
        isWorkingDay,
        isToday,
        dayNumber: date.getDate()
      });
    }

    return days;
  }, [currentMonth, workingDays]);

  const handleDateSelect = async (dateString: string) => {
    if (bookingFlow === 'BY_DATE' && selectedSpecialty) {
      console.log('[STEP] SelectDateStep → loadAvailableDoctors for date', { specialtyId: selectedSpecialty.specialtyId, dateString });
      await loadAvailableDoctors(selectedSpecialty.specialtyId, dateString);
    }
    console.log('[STEP] SelectDateStep → selectDate', { dateString });
    selectDate(dateString);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button variant="outline" size="sm" onClick={goToNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const canSelect = !day.isPast && (
            bookingFlow === 'BY_DOCTOR' ? day.isWorkingDay : true
          );
          
          return (
            <Button
              key={index}
              variant={day.isToday ? "default" : "ghost"}
              size="sm"
              className={`h-12 ${
                !day.isCurrentMonth 
                  ? 'text-gray-300' 
                  : day.isPast 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : day.isWorkingDay 
                      ? 'hover:bg-primary/10 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!canSelect}
              onClick={() => {
                if (!canSelect) return;
                console.log('[UI] Click day', { date: day.dateString, bookingFlow });
                handleDateSelect(day.dateString);
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-sm">{day.dayNumber}</span>
                {day.isWorkingDay && day.isCurrentMonth && !day.isPast && (
                  <Clock className="w-3 h-3 text-green-500" />
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4 text-green-500" />
          <span>Có lịch</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>Không có lịch</span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-gray-600">Đang tải lịch làm việc...</span>
          </div>
        </div>
      )}
    </div>
  );
}
