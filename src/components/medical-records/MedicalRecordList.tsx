'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  // Trash2,
  Calendar,
  User,
  // ExternalLink,
} from 'lucide-react';
import { 
  MedicalRecord, 
  Template, 
  MedicalRecordStatus 
} from '@/lib/types/medical-record';
import { patientProfileService } from '@/lib/services/patient-profile.service';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { userService } from '@/lib/services/user.service';

interface PatientProfileData {
  id: string;
  profileCode: string;
  name: string;
  patient?: {
    user?: {
      phone?: string;
    };
  };
}

interface TemplateData {
  id: string;
  templateCode: string;
  name: string;
  specialtyName: string;
}

interface DoctorData {
  id: string;
  name: string;
  email: string;
  phone: string;
  doctor?: {
    doctorCode: string;
    specialty: string;
  };
}

interface MedicalRecordListProps {
  medicalRecords: MedicalRecord[];
  templates: Template[];
  onView: (record: MedicalRecord) => void;
  // onDelete: (record: MedicalRecord) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export function MedicalRecordList({
  medicalRecords,
  templates,
  onView,
  // onDelete,
  isLoading = false,
}: MedicalRecordListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [patientProfiles, setPatientProfiles] = useState<Record<string, PatientProfileData>>({});
  const [templateData, setTemplateData] = useState<Record<string, TemplateData>>({});
  const [doctorData, setDoctorData] = useState<Record<string, DoctorData>>({});
  const [, setLoadingProfiles] = useState(false);
  const itemsPerPage = 10;

  const getStatusColor = (status: MedicalRecordStatus) => {
    switch (status) {
      case MedicalRecordStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case MedicalRecordStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800';
      case MedicalRecordStatus.IN_PROGRESS:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: MedicalRecordStatus) => {
    switch (status) {
      case MedicalRecordStatus.COMPLETED:
        return 'Hoàn thành';
      case MedicalRecordStatus.DRAFT:
        return 'Nháp';
      case MedicalRecordStatus.IN_PROGRESS:
        return 'Đang điều trị';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTemplateName = (templateId: string) => {
    // First try to get from loaded template data
    const template = templateData[templateId];
    if (template) {
      return template.name;
    }
    
    // Fallback to templates prop
    const templateFromProp = templates.find(t => t.templateCode === templateId);
    return templateFromProp ? templateFromProp.name : templateId;
  };

  const getDoctorInfo = (doctorId: string) => {
    const doctor = doctorData[doctorId];
    if (!doctor) {
      return {
        name: 'Đang tải...',
        specialty: 'N/A',
        code: doctorId.slice(0, 8) + '...'
      };
    }
    
    return {
      name: doctor.name,
      specialty: doctor.doctor?.specialty || 'N/A',
      code: doctor.doctor?.doctorCode || 'N/A'
    };
  };

  // Load additional data for medical records
  useEffect(() => {
    const loadAdditionalData = async () => {
      if (medicalRecords.length === 0) return;

      try {
        setLoadingProfiles(true);
        
        // Load patient profiles
        const uniquePatientIds = [...new Set(medicalRecords.map(record => record.patientProfileId))];
        const profiles = await patientProfileService.getByIds(uniquePatientIds);
        setPatientProfiles(profiles);

        // Load templates
        const uniqueTemplateIds = [...new Set(medicalRecords.map(record => record.templateId))];
        const templatePromises = uniqueTemplateIds.map(async (templateId) => {
          try {
            return await medicalRecordService.getTemplateById(templateId);
          } catch (error) {
            console.error(`Error loading template ${templateId}:`, error);
            return null;
          }
        });
        
        const templateResults = await Promise.all(templatePromises);
        const templateMap: Record<string, TemplateData> = {};
        templateResults.forEach(template => {
          if (template) {
            templateMap[template.id] = template;
          }
        });
        setTemplateData(templateMap);

        // Load doctors
        const uniqueDoctorIds = [...new Set(medicalRecords.map(record => record.doctorId).filter((id): id is string => !!id))];
        const doctors = await userService.getDoctorsByIds(uniqueDoctorIds);
        setDoctorData(doctors as Record<string, DoctorData>);

      } catch (error) {
        console.error('Error loading additional data:', error);
      } finally {
        setLoadingProfiles(false);
      }
    };

    loadAdditionalData();
  }, [medicalRecords]);

  const getPatientInfo = (patientProfileId: string) => {
    const profile = patientProfiles[patientProfileId];
    if (!profile) {
      return {
        name: 'Đang tải...',
        code: patientProfileId.slice(0, 8) + '...',
        phone: 'N/A'
      };
    }
    
    return {
      name: profile.name,
      code: profile.profileCode,
      phone: profile.patient?.user?.phone || 'N/A'
    };
  };

  const filteredRecords = useMemo(() => {
    const list = Array.isArray(medicalRecords) ? medicalRecords : [];
    return list.filter(record => {
      const matchesSearch = searchTerm === '' || 
        record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.patientProfileId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTemplateName(record.templateId).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesTemplate = templateFilter === 'all' || record.templateId === templateFilter;

      return matchesSearch && matchesStatus && matchesTemplate;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicalRecords, searchTerm, statusFilter, templateFilter, templates]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6 ">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value={MedicalRecordStatus.DRAFT}>Nháp</SelectItem>
                <SelectItem value={MedicalRecordStatus.COMPLETED}>Hoàn thành</SelectItem>
                <SelectItem value={MedicalRecordStatus.IN_PROGRESS}>Đang điều trị</SelectItem>
              </SelectContent>
            </Select>

            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Loại bệnh án" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {filteredRecords.length} bệnh án
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bệnh nhân</TableHead>
                <TableHead>Loại bệnh án</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Đang tải...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Không tìm thấy bệnh án nào
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50">
                   
                    <TableCell>
                      <div className="flex flex-col gap-1 ml-2.5">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-sm">
                            {getPatientInfo(record.patientProfileId).name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 ml-6">
                          {getPatientInfo(record.patientProfileId).code} • {getPatientInfo(record.patientProfileId).phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline">
                          {getTemplateName(record.templateId)}
                        </Badge>
                        {record.doctorId && (
                          <div className="text-xs text-gray-500">
                            Bác sĩ: {getDoctorInfo(record.doctorId).name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {getStatusText(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {formatDate(record.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(record)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="Chỉnh sửa"
                        >
                          <a href={`/medical-records/${record.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </a>
                        </Button>
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(record)}
                          title="Xóa"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button> */}
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="Mở trong tab mới"
                        >
                          <a href={`/medical-records/${record.id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="text-sm text-gray-600">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRecords.length)} trong tổng số {filteredRecords.length} bệnh án
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
