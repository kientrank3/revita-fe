'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientProfile } from '@/lib/api';
import { Calendar, FileText, User, MapPin, Phone, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface PatientProfileCardProps {
  profile: PatientProfile;
}

export function PatientProfileCard({ profile }: PatientProfileCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {profile.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {profile.gender === 'MALE' ? 'Nam' : 'Nữ'}
                </Badge>
                <span className="text-sm text-gray-500">
                  {getAge(profile.dateOfBirth)} tuổi
                </span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {profile.relationship}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Basic Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Sinh ngày: {formatDate(profile.dateOfBirth)}</span>
          </div>
          
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{profile.address}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Nghề nghiệp: {profile.occupation}</span>
          </div>
          
          {profile.emergencyContact && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>
                Liên hệ khẩn cấp: {profile.emergencyContact.name} 
                ({profile.emergencyContact.relationship}) - {profile.emergencyContact.phone}
              </span>
            </div>
          )}
          
          {profile.healthInsurance && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4" />
              <span>BHYT: {profile.healthInsurance}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-3 border-t border-gray-100">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/patient-profiles/${profile.id}/medical-records`}>
              <FileText className="h-4 w-4 mr-2" />
              Bệnh án
            </Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link href={`/patient-profiles/${profile.id}/prescriptions`}>
              <FileText className="h-4 w-4 mr-2" />
              Đơn thuốc
            </Link>
          </Button>
        </div>

        {/* Created Date */}
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-50">
          Tạo ngày: {formatDate(profile.createdAt)}
        </div>
      </CardContent>
    </Card>
  );
}