'use client';

import React, {  useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  X,
} from 'lucide-react';
import { userService } from '@/lib/services/user.service';
import { User as UserType, PatientProfile } from '@/lib/types/user';
import { toast } from 'sonner';

interface PatientSearchProps {
  onPatientProfileSelect: (patientProfile: PatientProfile | null) => void;
  selectedPatientProfile?: PatientProfile | null;
  compact?: boolean;
  onPatientSelect?: (patient: UserType | null) => void;
}

export function PatientSearch({ 
  onPatientProfileSelect, 
  selectedPatientProfile,
  compact = false,
  onPatientSelect,
}: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<UserType | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedPatientProfiles, setSelectedPatientProfiles] = useState<PatientProfile[]>([]);

  // Refresh profiles for selected patient

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
    setSelectedPatientProfiles(patient.patient?.patientProfiles || []);
    if (onPatientSelect) onPatientSelect(patient);
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

  const clearSelection = () => {
    // Reset all selections
    setSelectedPatient(null);
    setSelectedProfile(null);
    setSearchResults([]);
    setSearchQuery('');
    // Notify parent to clear selected profile
    onPatientProfileSelect(null);
    if (onPatientSelect) onPatientSelect(null);
  };



  // No delete endpoint -> remove delete logic



  // Compact version for create page
  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* Selected Patient Display */}
        {selectedPatientProfile ? (
          <div className="border border-green-200 rounded-lg p-3 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-900 text-sm truncate">{selectedPatientProfile.name}</p>
                  <p className="text-xs text-green-700 truncate">
                    {selectedPatientProfile.profileCode} • {formatDate(selectedPatientProfile.dateOfBirth)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={()=>{ clearSelection()}}
                className="text-green-600 hover:text-green-800 p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          /* Search Input */
          <div className="relative">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bệnh nhân..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                size="sm"
                className="flex items-center gap-1"
              >
                {isSearching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Search className="h-3 w-3" />
                )}
                Tìm
              </Button>
            </div>

            {/* Dropdown Results */}
            {(searchResults.length > 0 || selectedPatient) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3">
                  {searchResults.map((patient) => (
                    <div key={patient.id} className="mb-3 last:mb-0">
                      {/* Patient Info */}
                      <div 
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          selectedPatient?.id === patient.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{patient.name}</p>
                            <p className="text-xs text-gray-500 truncate">{patient.phone}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {patient.patient?.patientCode}
                        </Badge>
                      </div>

                      {/* Patient Profiles */}
                      {selectedPatient?.id === patient.id && patient.patient?.patientProfiles && (
                        <div className="ml-6 mt-2 space-y-1">
                          {patient.patient.patientProfiles.map((profile) => (
                            <div 
                              key={profile.id} 
                              className={`p-2 rounded cursor-pointer transition-colors text-sm ${
                                selectedProfile?.id === profile.id 
                                  ? 'bg-green-50 border border-green-200' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleProfileSelect(profile)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{profile.name}</p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {profile.profileCode} • {formatDate(profile.dateOfBirth)}
                                  </p>
                                </div>
                                {selectedProfile?.id === profile.id && (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
                  </div>
      )}

     
    </div>
  );
}

  // Full version (original)
  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="border rounded-lg p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tìm kiếm theo tên, số điện thoại hoặc email</label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên, số điện thoại hoặc email..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm"
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
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Kết quả tìm kiếm ({searchResults.length})
          </h4>
          <div className="space-y-4">
            {searchResults.map((patient) => (
              <div key={patient.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                {/* Patient Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">{patient.name}</h5>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
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
                    <Badge variant="outline" className="text-xs">{patient.patient?.patientCode}</Badge>
                    <Button
                      variant={selectedPatient?.id === patient.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePatientSelect(patient)}
                      className="text-xs"
                    >
                      {selectedPatient?.id === patient.id ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Đã chọn
                        </>
                      ) : (
                        'Chọn'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Patient Profiles */}
                {selectedPatient?.id === patient.id && (
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                        <User className="h-3 w-3" />
                        Hồ sơ bệnh nhân ({patient.patient?.patientProfiles?.length || 0})
                      </h6>
                      
                    </div>
                                          <div className="grid gap-2">
                        {(selectedPatient?.id === patient.id ? selectedPatientProfiles : patient.patient?.patientProfiles || []).map((profile) => (
                        <div 
                          key={profile.id} 
                          className={`border rounded p-2 cursor-pointer transition-colors text-sm ${
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
                              <div className="flex items-center gap-1 mt-1">
                                {/* <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditProfile(profile);
                                  }}
                                  className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button> */}
                                {/* Delete disabled: no endpoint */}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
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
                              <Check className="h-4 w-4 text-blue-600" />
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
        </div>
      )}

     

      {/* Selected Profile Summary */}
      {selectedPatientProfile && (
        <div className="border-green-200 bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-green-900 text-sm">{selectedPatientProfile.name}</h4>
              <p className="text-xs text-green-700">
                {selectedPatientProfile.profileCode} • {formatDate(selectedPatientProfile.dateOfBirth)}
              </p>
              <p className="text-xs text-green-600 truncate">{selectedPatientProfile.address}</p>
            </div>
            <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
              ID: {selectedPatientProfile.id}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
