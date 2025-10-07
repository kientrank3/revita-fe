'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { patientProfileApi, PatientProfile } from '@/lib/api';
import { Calendar, FileText, User, MapPin, Phone, CreditCard, Pencil } from 'lucide-react';
import Link from 'next/link';

interface PatientProfileCardProps {
  profile?: PatientProfile;
  patientProfileId?: string;
  showActions?: boolean;
}

export function PatientProfileCard({ profile: profileProp, patientProfileId, showActions = true }: PatientProfileCardProps) {
  const [profile, setProfile] = useState<PatientProfile | undefined>(profileProp);

  useEffect(() => {
    setProfile(profileProp);
  }, [profileProp]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!patientProfileId) return;
      try {
        const res = await patientProfileApi.getById(patientProfileId);
        setProfile(res.data);
      } catch {
        // silently fail; UI will show fallbacks
      }
    };
    if (!profileProp && patientProfileId) {
      fetchProfile();
    }
  }, [patientProfileId, profileProp]);
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

  if (!profile) {
    return null;
  }

  const safeName = profile.name ?? '—';
  const safeGender = (profile.gender || '').toString().toLowerCase();
  const isMale = safeGender === 'male' || safeGender === 'nam' || safeGender === 'm';
  const dob = profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '—';
  const ageText = profile.dateOfBirth ? `${getAge(profile.dateOfBirth)} tuổi` : '—';
  const address = profile.address ?? '—';
  const occupation = profile.occupation ?? '—';
  const relationship = profile.relationship ?? '—';
  const emergency = profile.emergencyContact;
  const healthInsurance = profile.healthInsurance;

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
                {safeName}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {isMale ? 'Nam' : 'Nữ'}
                </Badge>
                <span className="text-sm text-gray-500">
                  {ageText}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {relationship}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Basic Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Sinh ngày: {dob}</span>
          </div>
          
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{address}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Nghề nghiệp: {occupation}</span>
          </div>
          
          {emergency && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>
                Liên hệ khẩn cấp: {emergency.name || '—'} 
                ({emergency.relationship || '—'}) - {emergency.phone || '—'}
              </span>
            </div>
          )}
          
          {healthInsurance && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4" />
              <span>BHYT: {healthInsurance}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
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
            <Button asChild variant="secondary" size="sm" className="flex-1">
              <Link href={`/patient-profiles/${profile.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Sửa hồ sơ
              </Link>
            </Button>
          </div>
        )}

        {/* Created Date */}
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-50">
          Tạo ngày: {profile.createdAt ? formatDate(profile.createdAt) : '—'}
        </div>
      </CardContent>
    </Card>
  );
}