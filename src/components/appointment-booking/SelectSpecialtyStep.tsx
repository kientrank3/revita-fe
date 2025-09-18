"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { Specialty } from '@/lib/types/appointment-booking';
import { Stethoscope, Search } from 'lucide-react';

export function SelectSpecialtyStep() {
  const { selectSpecialty, loadSpecialties, loading } = useAppointmentBookingContext();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadSpecialtiesData = async () => {
      const data = await loadSpecialties();
      setSpecialties(data);
    };

    loadSpecialtiesData();
  }, [loadSpecialties]);

  const filteredSpecialties = specialties.filter(specialty =>
    specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    specialty.specialtyCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSpecialty = (specialty: Specialty) => {
    console.log('Selecting specialty:', specialty);
    selectSpecialty(specialty);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="cursor-pointer">
              <CardHeader>
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
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
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm chuyên khoa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Specialties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSpecialties.map((specialty) => (
          <Card
            key={specialty.specialtyId}
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-primary/50"
            onClick={() => handleSelectSpecialty(specialty)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{specialty.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {specialty.specialtyCode}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSpecialty(specialty);
                  }}
                >
                  Chọn
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSpecialties.length === 0 && (
        <div className="text-center py-8">
          <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Không tìm thấy chuyên khoa phù hợp' : 'Không có chuyên khoa nào'}
          </p>
        </div>
      )}
    </div>
  );
}
