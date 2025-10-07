'use client';

import { Card, CardContent } from '@/components/ui/card';
import { DrugSearch } from '@/components/medication-prescriptions/DrugSearch';

export default function PatientDrugSearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-4">Tìm kiếm thuốc</h1>
            <DrugSearch />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


