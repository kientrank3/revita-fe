'use client';

import { useState } from 'react';
import { MedicationPrescriptionList } from '@/components/medication-prescriptions/MedicationPrescriptionList';
import { CreatePrescriptionDialog } from '@/components/medication-prescriptions/CreatePrescriptionDialog';
import { DrugSearch } from '@/components/medication-prescriptions/DrugSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { medicationPrescriptionApi } from '@/lib/api';
// import { useAuth } from '@/lib/hooks/useAuth';
import { Plus, FileText, Search } from 'lucide-react';

export default function MedicationPrescriptionsManagementPage() {
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
//   const { user } = useAuth();

  const handleCreatePrescription = async (data: {
    patientProfileId: string;
    medicalRecordId?: string;
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[];
  }) => {
    try {
      await medicationPrescriptionApi.create(data);
      setActiveTab('prescriptions');
      // Refresh the prescriptions list
      window.location.reload();
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error; // Re-throw to let dialog handle the error display
    }
  };


  return (
    <div className="container mx-auto px-8 py-8 bg-white">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn thuốc</h1>
            <p className="text-gray-600 mt-2">
              Tạo và quản lý đơn thuốc cho bệnh nhân
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo đơn thuốc mới
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Đơn thuốc của tôi
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Tìm kiếm thuốc
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <MedicationPrescriptionList isDoctor={true} />
          </TabsContent>

          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Tìm kiếm thông tin thuốc</CardTitle>
                <p className="text-sm text-gray-600">
                  Tìm kiếm thông tin chi tiết về các loại thuốc từ cơ sở dữ liệu OpenFDA
                </p>
              </CardHeader>
              <CardContent>
                <DrugSearch />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Create Prescription Dialog */}
        <CreatePrescriptionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSave={handleCreatePrescription}
        />
      </div>
    </div>
  );
}
