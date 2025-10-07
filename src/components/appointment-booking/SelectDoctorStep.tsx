"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { User, Star, Clock, MapPin } from 'lucide-react';
import { Doctor } from '@/lib/types/appointment-booking';

export function SelectDoctorStep() {
  const {
    availableDoctors,
    selectedSpecialty,
    selectedDate,
    loading,
    selectDoctor,
    bookingFlow,
    loadAvailableDoctors,
    loadDoctorsBySpecialty,
  } = useAppointmentBookingContext();

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      if (bookingFlow === 'BY_DATE' && selectedSpecialty && selectedDate) {
        console.log('[STEP] SelectDoctorStep → BY_DATE branch', { selectedSpecialty, selectedDate });
        await loadAvailableDoctors(selectedSpecialty.specialtyId, selectedDate);
      } else if (bookingFlow === 'BY_DOCTOR' && selectedSpecialty) {
        console.log('[STEP] SelectDoctorStep → BY_DOCTOR branch', { selectedSpecialty });
        await loadDoctorsBySpecialty(selectedSpecialty.specialtyId);
      } else {
        console.log('[STEP] SelectDoctorStep → waiting conditions', { bookingFlow, hasSpecialty: !!selectedSpecialty, hasDate: !!selectedDate });
      }
    };
    fetchDoctors();
  }, [bookingFlow, selectedSpecialty, selectedDate, loadAvailableDoctors, loadDoctorsBySpecialty]);

  const filteredDoctors = availableDoctors.filter(doctor =>
    doctor.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialtyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectDoctor = (doctor: Doctor) => {
    selectDoctor(doctor);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
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
      {/* Search */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Tìm kiếm bác sĩ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDoctors.map((doctor) => (
          <Card
            key={doctor.doctorId}
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-primary/50"
            onClick={() => handleSelectDoctor(doctor)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{doctor.doctorName}</CardTitle>
                  <CardDescription className="text-sm">
                    {doctor.specialtyName}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{doctor.rating}</span>
                  <Badge variant="secondary" className="text-xs">
                    {doctor.yearsExperience} năm kinh nghiệm
                  </Badge>
                </div>
                
                {doctor.workSessionStart && doctor.workSessionEnd && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(doctor.workSessionStart).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {new Date(doctor.workSessionEnd).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                )}

                {doctor.roomName && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{doctor.roomName}</span>
                  </div>
                )}

                <p className="text-sm text-gray-600 mt-2">{doctor.description}</p>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDoctor(doctor);
                  }}
                >
                  Chọn
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Không tìm thấy bác sĩ phù hợp' : 'Không có bác sĩ nào'}
          </p>
        </div>
      )}
    </div>
  );
}
