'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { drugSearchApi } from '@/lib/api';
import { DrugSearchResult } from '@/lib/types/medication-prescription';
import { Search, Pill, Building, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DrugSearchProps {
  onSelectDrug?: (drug: DrugSearchResult) => void;
  showSelectButton?: boolean;
}

export function DrugSearch({ onSelectDrug, showSelectButton = false }: DrugSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<DrugSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setSelectedDrug] = useState<DrugSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [mode, setMode] = useState<'query' | 'field'>('query');
  const [fieldKey, setFieldKey] = useState<string>('openfda.brand_name');

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);
      const response =
        mode === 'field'
          ? await drugSearchApi.searchByField(fieldKey, searchTerm, { limit: 20 })
          : await drugSearchApi.search(searchTerm, { limit: 20 });
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching drugs:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDrug = (drug: DrugSearchResult) => {
    setSelectedDrug(drug);
    if (onSelectDrug) {
      onSelectDrug(drug);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-4">
        {/* Mode Selection */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48 flex-shrink-0">
            <Select value={mode} onValueChange={(v) => setMode(v as 'query' | 'field')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chế độ tìm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="query">Theo từ khóa</SelectItem>
                <SelectItem value="field">Theo trường</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'field' && (
            <div className="w-full sm:w-64 flex-shrink-0">
              <Select value={fieldKey} onValueChange={setFieldKey}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trường" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openfda.brand_name">Tên thương mại (brand)</SelectItem>
                  <SelectItem value="openfda.generic_name">Tên gốc/hoạt chất</SelectItem>
                  <SelectItem value="openfda.substance_name">Hoạt chất</SelectItem>
                  <SelectItem value="indications_and_usage">Chỉ định</SelectItem>
                  <SelectItem value="openfda.manufacturer_name">Nhà sản xuất</SelectItem>
                  <SelectItem value="openfda.route">Đường dùng</SelectItem>
                  <SelectItem value="pharmacological_class">Nhóm dược lý</SelectItem>
                  <SelectItem value="contraindications">Chống chỉ định</SelectItem>
                  <SelectItem value="warnings">Cảnh báo</SelectItem>
                  <SelectItem value="drug_interactions">Tương tác thuốc</SelectItem>
                  <SelectItem value="openfda.dosage_form">Dạng bào chế</SelectItem>
                  <SelectItem value="openfda.application_number">Số đăng ký</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Search Input and Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={mode === 'field' ? 'Nhập giá trị cần tìm theo trường...' : 'Tìm kiếm thuốc theo tên, hoạt chất...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 w-full"
            />
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={loading || !searchTerm.trim()}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Pill className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy thuốc</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Không có kết quả nào cho từ khóa &quot;<span className="font-medium text-gray-700">{searchTerm}</span>&quot;. 
                  Hãy thử với từ khóa khác hoặc kiểm tra chính tả.
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  Dữ liệu từ OpenFDA • Có thể cần thời gian để cập nhật
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {searchResults.length} kết quả
                  </Badge>
                  <span className="text-sm text-gray-600">
                    cho &quot;<span className="font-medium">{searchTerm}</span>&quot;
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Dữ liệu từ OpenFDA
                </div>
              </div>
              {searchResults.map((drug, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-200 border-l-2 border-l-blue-200">
                  <CardContent className="px-4 py-0">
                    <div className="space-y-4">
                      {/* Header with drug name and NDC */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Pill className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-xl text-gray-900">
                              {drug.openfda?.generic_name || drug.openfda?.brand_name || 'Không rõ tên'}
                            </h3>
                          </div>
                          {drug.openfda?.brand_name && drug.openfda.brand_name !== drug.openfda.generic_name && (
                            <p className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded inline-block">
                              Thương hiệu: {drug.openfda.brand_name}
                            </p>
                          )}
                        </div>
                        {drug.product_ndc && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-mono text-xs">
                            NDC: {drug.product_ndc}
                          </Badge>
                        )}
                      </div>

                      {/* Basic Information Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {drug.openfda?.dosage_form && (
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dạng bào chế</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{drug.openfda.dosage_form}</p>
                          </div>
                        )}
                        {drug.openfda?.route && (
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Đường dùng</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{drug.openfda.route}</p>
                          </div>
                        )}
                        {drug.strength && (
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Liều lượng</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{drug.strength}</p>
                          </div>
                        )}
                        {drug.openfda?.manufacturer_name && (
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Building className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nhà sản xuất</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{drug.openfda.manufacturer_name}</p>
                          </div>
                        )}
                      </div>

                      {/* Indications Preview */}
                      {drug.indications_and_usage && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Chỉ định</span>
                          </div>
                          <p className="text-sm text-green-800 line-clamp-2">
                            {drug.indications_and_usage.length > 150 
                              ? `${drug.indications_and_usage.substring(0, 150)}...` 
                              : drug.indications_and_usage}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 justify-end">
                        {showSelectButton && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSelectDrug(drug)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600"
                          >
                            <Pill className="h-4 w-4 mr-2" />
                            Chọn thuốc này
                          </Button>
                        )}

                        {/* Drug Details Dialog */}
                        <Dialog>
                          <DialogTrigger asChild className="flex-1 ">
                            <Button variant="outline" size="sm" className="flex-1 max-w-48">
                              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Chi tiết
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-xl">
                                <Pill className="h-6 w-6 text-blue-600" />
                                Chi tiết thuốc: {drug.openfda?.generic_name || drug.openfda?.brand_name || 'Không rõ tên'}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Basic Information */}
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-lg mb-3 text-blue-900">Thông tin cơ bản</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-white p-3 rounded-lg">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Tên chung (Generic)</label>
                                    <p className="text-sm font-semibold text-gray-900">{drug.openfda?.generic_name || '—'}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Thương hiệu (Brand)</label>
                                    <p className="text-sm font-semibold text-gray-900">{drug.openfda?.brand_name || '—'}</p>
                                  </div>
                                  {drug.product_ndc && (
                                    <div className="bg-white p-3 rounded-lg">
                                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">NDC Code</label>
                                      <p className="text-sm font-mono font-semibold text-gray-900">{drug.product_ndc}</p>
                                    </div>
                                  )}
                                  {drug.openfda?.manufacturer_name && (
                                    <div className="bg-white p-3 rounded-lg">
                                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Nhà sản xuất</label>
                                      <p className="text-sm font-semibold text-gray-900">{drug.openfda.manufacturer_name}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Medical Information */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {drug.openfda?.dosage_form && (
                                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                      <Package className="h-4 w-4 text-blue-600" />
                                      Dạng bào chế
                                    </label>
                                    <p className="text-sm font-semibold text-gray-900">{drug.openfda.dosage_form}</p>
                                  </div>
                                )}
                                {drug.openfda?.route && (
                                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Đường dùng
                                    </label>
                                    <p className="text-sm font-semibold text-gray-900">{drug.openfda.route}</p>
                                  </div>
                                )}
                                {drug.strength && (
                                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                      Liều lượng
                                    </label>
                                    <p className="text-sm font-semibold text-gray-900">{drug.strength}</p>
                                  </div>
                                )}
                              </div>

                              {/* Indications */}
                              {drug.indications_and_usage && (
                                <div className="border border-green-300 rounded-lg p-4">
                                  <label className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Chỉ định & Công dụng
                                  </label>
                                  <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">{drug.indications_and_usage}</p>
                                </div>
                              )}

                              {/* Dosage & Administration */}
                              {drug.dosage_and_administration && (
                                <div className="border border-blue-200 rounded-lg p-4">
                                  <label className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Liều dùng & Cách sử dụng
                                  </label>
                                  <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">{drug.dosage_and_administration}</p>
                                </div>
                              )}

                              {/* Warnings */}
                              {drug.warnings && (
                                <div className=" border border-yellow-200 rounded-lg p-4">
                                  <label className="text-xs font-medium text-yellow-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    Cảnh báo quan trọng
                                  </label>
                                  <p className="text-sm text-yellow-800 leading-relaxed whitespace-pre-wrap">{drug.warnings}</p>
                                </div>
                              )}

                              {/* Contraindications */}
                              {drug.contraindications && (
                                <div className=" border border-red-200 rounded-lg p-4">
                                  <label className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Chống chỉ định
                                  </label>
                                  <p className="text-sm text-red-800 leading-relaxed whitespace-pre-wrap">{drug.contraindications}</p>
                                </div>
                              )}

                              {/* Adverse Reactions */}
                              {drug.adverse_reactions && (
                                <div className="border border-purple-300 rounded-lg p-4">
                                  <label className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Tác dụng phụ
                                  </label>
                                  <p className="text-sm text-purple-800 leading-relaxed whitespace-pre-wrap">{drug.adverse_reactions}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}