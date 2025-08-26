'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  MedicalRecord, 
  Template, 
  CreateMedicalRecordDto, 
  UpdateMedicalRecordDto
} from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { useAuth } from '@/lib/hooks/useAuth';
import { DynamicMedicalRecordForm } from './DynamicMedicalRecordForm';
import { MedicalRecordViewer } from './MedicalRecordViewer';
import { MedicalRecordList } from './MedicalRecordList';

interface MedicalRecordManagerProps {
  patientProfileId?: string;
  doctorId?: string;
  appointmentId?: string;
}

export function MedicalRecordManager({
  patientProfileId,
  doctorId,
  appointmentId,
}: MedicalRecordManagerProps) {
  const { user } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'view' | 'edit'>('list');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Use user ID from auth if doctorId is not provided
  const currentDoctorId = doctorId || user?.id;

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load templates from API
        const templatesData = await medicalRecordService.getTemplates();
        setTemplates(templatesData);

        // Load medical records from API
        let records: MedicalRecord[];
        if (patientProfileId) {
          // Nếu có patientProfileId, lấy bệnh án của bệnh nhân đó
          records = await medicalRecordService.getByPatientProfile(patientProfileId);
        } else if (doctorId) {
          // Nếu chỉ có doctorId, lấy tất cả bệnh án của bác sĩ đó
          records = await medicalRecordService.getAll();
        } else {
          // Lấy tất cả bệnh án (cho admin)
          records = await medicalRecordService.getAll();
        }
        
        setMedicalRecords(records);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [patientProfileId, doctorId, appointmentId]);

  const handleCreate = () => {
    setCurrentView('create');
    setIsDialogOpen(true);
  };

  const handleView = (record: MedicalRecord) => {
    const template = templates.find(t => t.templateCode === record.templateId);
    if (template) {
      setSelectedRecord(record);
      setSelectedTemplate(template);
      setCurrentView('view');
      setIsDialogOpen(true);
    }
  };

  const handleEdit = (record: MedicalRecord) => {
    const template = templates.find(t => t.templateCode === record.templateId);
    if (template) {
      setSelectedRecord(record);
      setSelectedTemplate(template);
      setCurrentView('edit');
      setIsDialogOpen(true);
    }
  };

  const handleDelete = async (record: MedicalRecord) => {
    if (confirm('Bạn có chắc chắn muốn xóa bệnh án này?')) {
      try {
        await medicalRecordService.delete(record.id);
        setMedicalRecords(prev => prev.filter(r => r.id !== record.id));
        toast.success('Xóa bệnh án thành công');
      } catch (error) {
        console.error('Error deleting record:', error);
        toast.error('Có lỗi xảy ra khi xóa bệnh án');
      }
    }
  };

  const handleSubmitCreate = async (data: CreateMedicalRecordDto) => {
    try {
      // Add doctor ID if not provided
      const recordData = {
        ...data,
        doctorId: data.doctorId || currentDoctorId,
      };
      
      const newRecord = await medicalRecordService.create(recordData);
      setMedicalRecords(prev => [newRecord, ...prev]);
      setCurrentView('list');
      setIsDialogOpen(false);
      toast.success('Tạo bệnh án thành công');
    } catch (error) {
      console.error('Error creating record:', error);
      toast.error('Có lỗi xảy ra khi tạo bệnh án');
      throw error;
    }
  };

  const handleSubmitEdit = async (data: UpdateMedicalRecordDto) => {
    if (!selectedRecord) return;

    try {
      const updatedRecord = await medicalRecordService.update(selectedRecord.id, data);
      setMedicalRecords(prev => 
        prev.map(r => r.id === selectedRecord.id ? updatedRecord : r)
      );
      setCurrentView('list');
      setIsDialogOpen(false);
      toast.success('Cập nhật bệnh án thành công');
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Có lỗi xảy ra khi cập nhật bệnh án');
      throw error;
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setIsDialogOpen(false);
    setSelectedRecord(null);
    setSelectedTemplate(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (selectedRecord) {
      const dataStr = JSON.stringify(selectedRecord, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medical-record-${selectedRecord.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderDialogContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo bệnh án mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <Button
                    key={template.templateCode}
                    variant={selectedTemplate?.templateCode === template.templateCode ? 'default' : 'outline'}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <span className="font-semibold">{template.name}</span>
                    <span className="text-xs text-gray-600">{template.specialtyName}</span>
                  </Button>
                ))}
              </div>
              {selectedTemplate && (
                <DynamicMedicalRecordForm
                  template={selectedTemplate}
                  patientProfileId={patientProfileId || ''}
                  doctorId={currentDoctorId}
                  appointmentId={appointmentId}
                  onSubmit={handleSubmitCreate}
                  onCancel={handleCancel}
                />
              )}
            </div>
          </DialogContent>
        );

      case 'view':
        return selectedRecord && selectedTemplate ? (
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết bệnh án</DialogTitle>
            </DialogHeader>
            <MedicalRecordViewer
              medicalRecord={selectedRecord}
              template={selectedTemplate}
              onEdit={() => setCurrentView('edit')}
              onPrint={handlePrint}
              onDownload={handleDownload}
            />
          </DialogContent>
        ) : null;

      case 'edit':
        return selectedRecord && selectedTemplate ? (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa bệnh án</DialogTitle>
            </DialogHeader>
            <DynamicMedicalRecordForm
              template={selectedTemplate}
              patientProfileId={patientProfileId || selectedRecord.patientProfileId}
              doctorId={selectedRecord.doctorId}
              appointmentId={selectedRecord.appointmentId}
              onSubmit={handleSubmitEdit}
              onCancel={handleCancel}
              initialData={selectedRecord.content}
              isEditing={true}
            />
          </DialogContent>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <MedicalRecordList
        medicalRecords={medicalRecords}
        templates={templates}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        isLoading={isLoading}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {renderDialogContent()}
      </Dialog>
    </div>
  );
}
