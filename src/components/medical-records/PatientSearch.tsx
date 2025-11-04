'use client';

import React, {  useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  User, 
  Phone, 
  Calendar,
  MapPin,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { patientProfileService } from '@/lib/services/patient-profile.service';
import { userService } from '@/lib/services/user.service';
import { PatientProfile, User as UserType } from '@/lib/types/user';
import { toast } from 'sonner';

interface PatientSearchProps {
  onPatientProfileSelect: (patientProfile: PatientProfile | null) => void;
  selectedPatientProfile?: PatientProfile | null;
  compact?: boolean;
  onPatientSelect?: (patient: UserType | null) => void;
  selectedPatient?: UserType | null;
}

export function PatientSearch({ 
  onPatientProfileSelect, 
  selectedPatientProfile,
  compact = false,
  onPatientSelect,
  selectedPatient,
}: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientProfile[]>([]);
  const [patientResults, setPatientResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'profiles' | 'patients'>('profiles');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Vui lòng nhập thông tin tìm kiếm');
      return;
    }

    try {
      setIsSearching(true);
      
      if (searchMode === 'profiles') {
        // Search PatientProfiles
        try {
          await patientProfileService.testConnection();
        } catch (testError) {
          console.error('Test connection failed:', testError);
          toast.error('Không thể kết nối đến API. Vui lòng kiểm tra kết nối mạng.');
          return;
        }
        
        const response = await patientProfileService.searchPatientProfiles(searchQuery.trim());
        console.log('Search response:', response); // Debug log
        
        setSearchResults(response.patientProfiles);
        setPatientResults([]); // Clear patient results
        
        if (response.patientProfiles.length === 0) {
          toast.info('Không tìm thấy hồ sơ bệnh nhân nào');
        }
      } else {
        // Search Patients (Users with role 'PATIENT')
        const response = await userService.searchUsers(searchQuery.trim());
        const patients = response.users.filter((user: UserType) => user.role === 'PATIENT');
        
        setPatientResults(patients);
        setSearchResults([]); // Clear profile results
        
        if (patients.length === 0) {
          toast.info('Không tìm thấy bệnh nhân nào');
        }
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Có lỗi xảy ra khi tìm kiếm');
    } finally {
      setIsSearching(false);
    }
  };

  const handleProfileSelect = (profile: PatientProfile) => {
    onPatientProfileSelect(profile);
  };

  const handlePatientSelect = (patient: UserType) => {
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatGender = (gender: string) => {
    return gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';
  };

  const clearSelection = () => {
    // Reset all selections
    setSearchResults([]);
    setPatientResults([]);
    setSearchQuery('');
    // Notify parent to clear selected profile and patient
    onPatientProfileSelect(null);
    if (onPatientSelect) onPatientSelect(null);
  };

  // Compact version for create page
  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* Selected Patient/Profile Display */}
        {(selectedPatientProfile || selectedPatient) ? (
          <div className="border border-green-200 rounded-lg p-3 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-900 text-sm truncate">
                    {selectedPatientProfile?.name || selectedPatient?.name}
                  </p>
                  <p className="text-xs text-green-700 truncate">
                    {selectedPatientProfile?.profileCode || selectedPatient?.patient?.patientCode} • 
                    {selectedPatientProfile?.dateOfBirth ? formatDate(selectedPatientProfile.dateOfBirth) : 
                     selectedPatient?.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : ''}
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
            <div className="flex gap-2 items-center">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bệnh nhân..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm h-10"
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
            {(searchResults.length > 0 || patientResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3">
                  {/* Patient Profile Results */}
                  {searchResults.map((profile: PatientProfile) => {
                    const isSelected = selectedPatientProfile ? (selectedPatientProfile as PatientProfile).id === profile.id : false;
                    return (
                    <div 
                      key={profile.id} 
                      className={`p-2 rounded cursor-pointer transition-colors text-sm mb-2 last:mb-0 ${
                        isSelected 
                          ? 'bg-green-50 border border-green-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleProfileSelect(profile)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{profile.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {profile.profileCode} • {formatDate(profile.dateOfBirth)}
                              {profile.phone && ` • ${profile.phone}`}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    );
                  })}
                  
                  {/* Patient Results */}
                  {patientResults.map((patient: UserType) => {
                    const isSelected = selectedPatient ? (selectedPatient as UserType).id === patient.id : false;
                    return (
                    <div 
                      key={patient.id} 
                      className={`p-2 rounded cursor-pointer transition-colors text-sm mb-2 last:mb-0 ${
                        isSelected 
                          ? 'bg-green-50 border border-green-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{patient.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {patient.patient?.patientCode} • {patient.phone}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    );
                  })}
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
            
            {/* Search Mode Toggle */}
            <div className="flex gap-2 my-3">
              <Button
                variant={searchMode === 'profiles' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('profiles')}
                className="text-xs"
              >
                Hồ sơ bệnh nhân
              </Button>
              <Button
                variant={searchMode === 'patients' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('patients')}
                className="text-xs"
              >
                Tài khoản bệnh nhân
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchMode === 'profiles' ? 
                  "Nhập tên, số điện thoại hoặc mã hồ sơ..." : 
                  "Nhập tên, số điện thoại hoặc mã bệnh nhân..."}
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
      {(searchResults.length > 0 || patientResults.length > 0) && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Kết quả tìm kiếm ({searchResults.length + patientResults.length})
          </h4>
          <div className="space-y-4">
            {/* Patient Profile Results */}
            {searchResults.map((profile: PatientProfile) => (
              <div 
                key={profile.id} 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedPatientProfile?.id === profile.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleProfileSelect(profile)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">{profile.name}</h5>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {profile.profileCode}
                          </Badge>
                        </span>
                        {profile.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {profile.phone}
                          </span>
                        )}
                        {profile.isActive && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            Hoạt động
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPatientProfile?.id === profile.id && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
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
            ))}
            
            {/* Patient Results */}
            {patientResults.map((patient: UserType) => (
              <div 
                key={patient.id} 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedPatient && (selectedPatient as UserType).id === patient.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handlePatientSelect(patient)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">{patient.name}</h5>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {patient.patient?.patientCode}
                          </Badge>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Tài khoản
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPatient && (selectedPatient as UserType).id === patient.id && (
                      <Check className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(patient.dateOfBirth)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {formatGender(patient.gender)}
                  </span>
                  <span className="flex items-center gap-1 col-span-2">
                    <MapPin className="h-3 w-3" />
                    {patient.address}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Email: {patient.email}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

     

      {/* Selected Profile/Patient Summary */}
      {(selectedPatientProfile || selectedPatient) && (
        <div className="border-green-200 bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-green-900 text-sm">
                {selectedPatientProfile?.name || selectedPatient?.name}
              </h4>
              <p className="text-xs text-green-700">
                {selectedPatientProfile?.profileCode || selectedPatient?.patient?.patientCode} • 
                {selectedPatientProfile?.dateOfBirth ? formatDate(selectedPatientProfile.dateOfBirth) : 
                 selectedPatient?.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : ''}
                {selectedPatientProfile?.phone && ` • ${selectedPatientProfile.phone}`}
                {selectedPatient?.phone && ` • ${selectedPatient.phone}`}
              </p>
              <p className="text-xs text-green-600 truncate">
                {selectedPatientProfile?.address || selectedPatient?.address}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
                ID: {selectedPatientProfile?.id || selectedPatient?.id}
              </Badge>
              {selectedPatientProfile && (
                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                  Hồ sơ
                </Badge>
              )}
              {selectedPatient && (
                <Badge variant="default" className="text-xs bg-purple-100 text-purple-800">
                  Tài khoản
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
