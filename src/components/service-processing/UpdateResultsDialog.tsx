'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { serviceProcessingService } from '@/lib/services/service-processing.service';
import { PrescriptionService } from '@/lib/types/service-processing';

interface UpdateResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: PrescriptionService;
  onUpdate: () => void;
}

export function UpdateResultsDialog({
  open,
  onOpenChange,
  service,
  onUpdate
}: UpdateResultsDialogProps) {
  const [results, setResults] = useState<string[]>(service.results || []);
  const [note, setNote] = useState(service.note || '');
  const [updating, setUpdating] = useState(false);

  const handleAddResult = () => {
    setResults([...results, '']);
  };

  const handleRemoveResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const handleResultChange = (index: number, value: string) => {
    const newResults = [...results];
    newResults[index] = value;
    setResults(newResults);
  };

  const handleSubmit = async () => {
    // Filter out empty results
    const filteredResults = results.filter(result => result.trim() !== '');

    if (filteredResults.length === 0) {
      toast.error('Vui lòng nhập ít nhất một kết quả');
      return;
    }

    setUpdating(true);
    try {
      await serviceProcessingService.updateServiceResults({
        prescriptionServiceId: service.id,
        results: filteredResults,
        note: note.trim() || undefined,
      });

      toast.success('Cập nhật kết quả thành công');
      onOpenChange(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating results:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật kết quả');
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setResults(service.results || []);
    setNote(service.note || '');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Cập nhật kết quả - {service.service.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Dịch vụ</div>
                <div className="font-medium">{service.service.name}</div>
                <div className="text-sm text-gray-500">{service.service.serviceCode}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Thời gian dự kiến</div>
                <div className="font-medium">{service.service.timePerPatient} phút</div>
              </div>
            </div>
            {service.service.description && (
              <div className="mt-2">
                <div className="text-sm text-gray-600">Mô tả</div>
                <div className="text-sm">{service.service.description}</div>
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="results">Kết quả (*)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddResult}
              >
                Thêm kết quả
              </Button>
            </div>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    placeholder={`Kết quả ${index + 1}`}
                    value={result}
                    onChange={(e) => handleResultChange(index, e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  {results.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveResult(index)}
                      className="px-3"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="note"
              placeholder="Ghi chú về quá trình thực hiện hoặc kết quả..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={updating}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={updating}>
            {updating ? 'Đang cập nhật...' : 'Cập nhật kết quả'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

