'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  MapPin,
  Check,
  Loader2,
  Users
} from 'lucide-react';
import { userService } from '@/lib/services/user.service';
import { User as UserType, PatientProfile } from '@/lib/types/user';
import { toast } from 'sonner';

interface PatientSearchProps {
  onPatientProfileSelect: (patientProfile: PatientProfile) => void;
  selectedPatientProfile?: PatientProfile | null;
}

export function PatientSearch({ onPatientProfileSelect, selectedPatientProfile }: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<UserType | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Vui lòng nhập thông tin tìm kiếm');
      return;
    }

    try {
      setIsSearching(true);
      const response = await userService.searchUsers(searchQuery.trim());
      
      // Filter only patients
      const patients = response.users.filter((user: { role: string; }) => user.role === 'PATIENT');
      setSearchResults(patients);
      
      if (patients.length === 0) {
        toast.info('Không tìm thấy bệnh nhân nào');
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Có lỗi xảy ra khi tìm kiếm bệnh nhân');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePatientSelect = (patient: UserType) => {
    setSelectedPatient(patient);
    setSelectedProfile(null);
  };

  const handleProfileSelect = (profile: PatientProfile) => {
    setSelectedProfile(profile);
    onPatientProfileSelect(profile);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatGender = (gender: string) => {
    return gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Tìm kiếm bệnh nhân
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="searchQuery">Tìm kiếm theo tên, số điện thoại hoặc email</Label>
              <div className="flex gap-2">
                <Input
                  id="searchQuery"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập tên, số điện thoại hoặc email..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="flex items-center gap-2"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Kết quả tìm kiếm ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((patient) => (
                <div key={patient.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  {/* Patient Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {patient.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{patient.patient?.patientCode}</Badge>
                      <Button
                        variant={selectedPatient?.id === patient.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        {selectedPatient?.id === patient.id ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Đã chọn
                          </>
                        ) : (
                          'Chọn'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Patient Profiles */}
                  {selectedPatient?.id === patient.id && patient.patient?.patientProfiles && (
                    <div className="border-t pt-4">
                      <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Hồ sơ bệnh nhân ({patient.patient.patientProfiles.length})
                      </h5>
                      <div className="grid gap-3">
                        {patient.patient.patientProfiles.map((profile) => (
                          <div 
                            key={profile.id} 
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              selectedProfile?.id === profile.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleProfileSelect(profile)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">{profile.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {profile.profileCode}
                                  </Badge>
                                  {profile.isActive && (
                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                      Hoạt động
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(profile.dateOfBirth)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {formatGender(profile.gender)}
                                  </span>
                                  <span className="flex items-center gap-1 col-span-2">
                                    <MapPin className="h-3 w-3" />
                                    {profile.address}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {profile.occupation} • {profile.relationship}
                                </div>
                              </div>
                              {selectedProfile?.id === profile.id && (
                                <Check className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Profile Summary */}
      {selectedPatientProfile && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Check className="h-5 w-5" />
              Hồ sơ bệnh nhân đã chọn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">{selectedPatientProfile.name}</h4>
                <p className="text-sm text-green-700">
                  {selectedPatientProfile.profileCode} • {formatDate(selectedPatientProfile.dateOfBirth)}
                </p>
                <p className="text-xs text-green-600">{selectedPatientProfile.address}</p>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-300">
                ID: {selectedPatientProfile.id}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
