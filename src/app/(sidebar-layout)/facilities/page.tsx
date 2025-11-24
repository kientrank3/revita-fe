"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw, X, Search, Settings } from "lucide-react"
import { specialtiesService, clinicRoomsService, boothsService, type Specialty, type ClinicRoom, type Booth, type ListResponse } from "@/lib/services/facilities.service"
import { servicesService, type Service } from "@/lib/services/services.service"

// MultiSelectCombobox Component
function MultiSelectCombobox({
  options,
  selectedIds,
  onSelectionChange,
  placeholder = "Tìm kiếm và chọn dịch vụ...",
  displayValue = (item: Service) => `${item.name} - ${item.serviceCode}`,
  loading = false,
}: {
  options: Service[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  placeholder?: string
  displayValue?: (item: Service) => string
  loading?: boolean
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Filter options: exclude already selected and filter by search query
  const availableOptions = React.useMemo(() => {
    return options.filter(
      (option) =>
        !selectedIds.includes(option.id) &&
        (searchQuery.trim() === "" ||
          option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          option.serviceCode?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [options, selectedIds, searchQuery])

  const selectedItems = React.useMemo(() => {
    return options.filter((opt) => selectedIds.includes(opt.id))
  }, [options, selectedIds])

  const handleToggle = (serviceId: string) => {
    if (selectedIds.includes(serviceId)) {
      onSelectionChange(selectedIds.filter((id) => id !== serviceId))
    } else {
      onSelectionChange([...selectedIds, serviceId])
    }
    setSearchQuery("")
  }

  const handleRemove = (serviceId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== serviceId))
  }

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected items display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-lg bg-muted/50">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1 px-2 py-1 bg-background border rounded-md text-sm"
            >
              <span>{displayValue(item)}</span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input with dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-8"
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="size-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Đang tải...</span>
              </div>
            ) : availableOptions.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {searchQuery.trim() ? "Không tìm thấy dịch vụ nào" : "Không còn dịch vụ nào để chọn"}
              </div>
            ) : (
              <div className="p-1">
                {availableOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleToggle(option.id)}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm transition-colors"
                  >
                    {displayValue(option)}
                    {option.price && (
                      <span className="ml-2 text-muted-foreground">
                        ({option.price.toLocaleString()} VND)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function usePaginatedList<T>(fetcher: (page: number, limit: number) => Promise<ListResponse<T>>) {
  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(10)
  const [data, setData] = React.useState<T[]>([])
  const [meta, setMeta] = React.useState<{ page: number; limit: number; total: number; totalPages: number }>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher(page, limit)
      setData(res.data)
      setMeta(res.meta)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [fetcher, page, limit])

  React.useEffect(() => {
    void reload()
  }, [reload])

  return { data, meta, loading, error, page, setPage, limit, reload }
}

export default function FacilitiesPage() {
  const [tab, setTab] = React.useState("specialties")
  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col gap-6 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Quản lý cơ sở khám chữa bệnh</h2>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="specialties">Khoa chuyên môn</TabsTrigger>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="rooms">Phòng chức năng</TabsTrigger>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="booths">Buồng khám</TabsTrigger>
          </TabsList>

          <TabsContent value="specialties" className="mt-4">
            <SpecialtiesTab />
          </TabsContent>
          <TabsContent value="rooms" className="mt-4">
            <ClinicRoomsTab />
          </TabsContent>
          <TabsContent value="booths" className="mt-4">
            <BoothsTab />
          </TabsContent>
        </Tabs>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  )
}

function SpecialtiesTab() {
  const fetcher = React.useCallback(async (page: number, limit: number) => {
    return specialtiesService.listSpecialties(page, limit)
  }, [])
  const { data, meta, loading, error, page, setPage, reload } = usePaginatedList<Specialty>(fetcher)

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Specialty | null>(null)
  const [form, setForm] = React.useState<{ specialtyCode: string; name: string }>({ specialtyCode: "", name: "" })
  const [submitting, setSubmitting] = React.useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ specialtyCode: "", name: "" })
    setOpen(true)
  }
  const openEdit = (s: Specialty) => {
    setEditing(s)
    setForm({ specialtyCode: s.specialtyCode, name: s.name })
    setOpen(true)
  }

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      if (editing) {
        await specialtiesService.updateSpecialty(editing.id, form)
        toast.success("Cập nhật khoa thành công")
      } else {
        await specialtiesService.createSpecialty(form)
        toast.success("Tạo khoa thành công")
      }
      setOpen(false)
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (s: Specialty) => {
    if (!confirm(`Xóa khoa "${s.name}"?`)) return
    try {
      await specialtiesService.deleteSpecialty(s.id)
      toast.success("Xóa khoa thành công")
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    }
  }

  return (
    <div className="flex flex-col gap-3 ">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => reload()} disabled={loading}>
            <RefreshCw className="size-4" /> Làm mới
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Thêm khoa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật khoa" : "Thêm khoa"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="grid gap-2">
                <Label htmlFor="specialtyCode">Mã khoa</Label>
                <Input id="specialtyCode" value={form.specialtyCode} onChange={(e) => setForm((f) => ({ ...f, specialtyCode: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Tên khoa</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={onSubmit} disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />} Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      <Table className="rounded-lg ">
        <TableHeader>
          <TableRow className="bg-muted px-8">
            <TableHead className="px-4">Mã khoa</TableHead>
            <TableHead className="px-4">Tên khoa</TableHead>
            <TableHead className="px-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((s) => (
            <TableRow key={s.id} className="px-4">
              <TableCell className="px-4">{s.specialtyCode}</TableCell>
              <TableCell className="px-4">{s.name}</TableCell>
              <TableCell className="flex gap-2 px-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                  <Pencil className="size-4" /> Sửa
                </Button>
                <Button variant="outline"  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300" size="sm" onClick={() => onDelete(s)}>
                  <Trash2 className="size-4"  color="red"/> Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {loading && (
            <TableRow>
              <TableCell colSpan={3}>
                <div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Đang tải...</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls page={meta.page} totalPages={meta.totalPages} onPrev={() => setPage(Math.max(1, page - 1))} onNext={() => setPage(Math.min(meta.totalPages || 1, page + 1))} />
    </div>
  )
}

function ClinicRoomsTab() {
  const [specialtyFilter, setSpecialtyFilter] = React.useState<string | undefined>(undefined)
  const fetcher = React.useCallback(async (page: number, limit: number) => {
    return clinicRoomsService.listClinicRooms(page, limit, specialtyFilter)
  }, [specialtyFilter])
  const { data, meta, loading, error, page, setPage, reload } = usePaginatedList<ClinicRoom>(fetcher)

  const [specialties, setSpecialties] = React.useState<Specialty[]>([])
  const [services, setServices] = React.useState<Service[]>([])
  const [loadingServices, setLoadingServices] = React.useState(false)

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await specialtiesService.listSpecialties(1)
        setSpecialties(res.data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không tải được danh sách khoa")
      }
    })()
  }, [])

  React.useEffect(() => {
    void (async () => {
      setLoadingServices(true)
      try {
        const res = await servicesService.listServices({ isActive: "true" })
        setServices(res.data.services || [])
      } catch (e) {
        console.error("Failed to load services", e)
      } finally {
        setLoadingServices(false)
      }
    })()
  }, [])

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ClinicRoom | null>(null)
  const [form, setForm] = React.useState<{ 
    roomName: string
    specialtyId: string
    description?: string
    address?: string
    booths?: Array<{
      id?: string
      name: string
      description?: string
      isActive: boolean
      serviceIds: string[]
    }>
  }>({ roomName: "", specialtyId: "", booths: [] })
  const [submitting, setSubmitting] = React.useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ roomName: "", specialtyId: "", booths: [] })
    setOpen(true)
  }
  const openEdit = async (r: ClinicRoom) => {
    setEditing(r)
    try {
      const roomDetail = await clinicRoomsService.getClinicRoom(r.id)
      setForm({ 
        roomName: roomDetail.roomName, 
        specialtyId: roomDetail.specialtyId, 
        description: roomDetail.description ?? undefined, 
        address: roomDetail.address ?? undefined,
        booths: roomDetail.booths?.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description ?? undefined,
          isActive: b.isActive,
          serviceIds: b.services?.map(s => s.id) || []
        })) || []
      })
      setOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được thông tin phòng")
    }
  }

  const addBooth = () => {
    setForm(f => ({
      ...f,
      booths: [...(f.booths || []), { name: "", isActive: true, serviceIds: [] }]
    }))
  }

  const removeBooth = (index: number) => {
    setForm(f => ({
      ...f,
      booths: f.booths?.filter((_, i) => i !== index) || []
    }))
  }

  const updateBooth = (index: number, updates: Partial<{ name: string; description?: string; isActive: boolean; serviceIds: string[] }>) => {
    setForm(f => ({
      ...f,
      booths: f.booths?.map((b, i) => i === index ? { ...b, ...updates } : b) || []
    }))
  }

  const toggleBoothService = (boothIndex: number, serviceId: string) => {
    setForm(f => {
      const booth = f.booths?.[boothIndex]
      if (!booth) return f
      const serviceIds = booth.serviceIds || []
      const newServiceIds = serviceIds.includes(serviceId)
        ? serviceIds.filter(id => id !== serviceId)
        : [...serviceIds, serviceId]
      return {
        ...f,
        booths: f.booths?.map((b, i) => i === boothIndex ? { ...b, serviceIds: newServiceIds } : b) || []
      }
    })
  }

  const onSubmit = async () => {
    if (!form.roomName || !form.specialtyId) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    setSubmitting(true)
    try {
      const payload: any = {
        roomName: form.roomName,
        specialtyId: form.specialtyId,
        description: form.description,
        address: form.address,
      }
      if (form.booths && form.booths.length > 0) {
        payload.booths = form.booths.map(b => ({
          ...(b.id && { id: b.id }),
          name: b.name,
          description: b.description,
          isActive: b.isActive,
          serviceIds: b.serviceIds
        }))
      }
      if (editing) {
        await clinicRoomsService.updateClinicRoom(editing.id, payload)
        toast.success("Cập nhật phòng thành công")
      } else {
        await clinicRoomsService.createClinicRoom(payload)
        toast.success("Tạo phòng thành công")
      }
      setOpen(false)
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (r: ClinicRoom) => {
    if (!confirm(`Xóa phòng "${r.roomName}"?`)) return
    try {
      await clinicRoomsService.deleteClinicRoom(r.id)
      toast.success("Xóa phòng thành công")
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={specialtyFilter} onValueChange={(v) => { setSpecialtyFilter(v || undefined); }}>
            <SelectTrigger className="min-w-56"><SelectValue placeholder="Lọc theo khoa" /></SelectTrigger>
            <SelectContent>
              {specialties.map((s) => (
                <SelectItem key={s.id} value={s.id}>{`${s.name} (${s.specialtyCode})`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setSpecialtyFilter(undefined); void reload() }} disabled={loading}>Bỏ lọc</Button>
          <Button variant="outline" onClick={() => reload()} disabled={loading}><RefreshCw className="size-4" /> Làm mới</Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="size-4" /> Thêm phòng</Button>
          </DialogTrigger>
          <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật phòng" : "Thêm phòng"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              {/* Cột trái: Thông tin phòng */}
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="roomName">Tên phòng *</Label>
                  <Input id="roomName" value={form.roomName} onChange={(e) => setForm((f) => ({ ...f, roomName: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Khoa *</Label>
                  <Select value={form.specialtyId} onValueChange={(v) => setForm((f) => ({ ...f, specialtyId: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn khoa" /></SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{`${s.name} (${s.specialtyCode})`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Input id="description" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input id="address" value={form.address ?? ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
              </div>

              {/* Cột phải: Danh sách buồng khám */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label>Danh sách buồng khám</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBooth}>
                    <Plus className="size-4" /> Thêm buồng
                  </Button>
                </div>
                {form.booths && form.booths.length > 0 ? (
                  <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {form.booths.map((booth, boothIndex) => (
                      <div key={boothIndex} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Buồng {boothIndex + 1}</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeBooth(boothIndex)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          <Label>Tên buồng *</Label>
                          <Input 
                            value={booth.name} 
                            onChange={(e) => updateBooth(boothIndex, { name: e.target.value })} 
                            placeholder="Nhập tên buồng"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Mô tả</Label>
                          <Input 
                            value={booth.description ?? ""} 
                            onChange={(e) => updateBooth(boothIndex, { description: e.target.value })} 
                            placeholder="Nhập mô tả"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={booth.isActive} 
                            onCheckedChange={(checked) => updateBooth(boothIndex, { isActive: checked === true })} 
                          />
                          <Label className="text-sm">Đang hoạt động</Label>
                        </div>
                        <div className="grid gap-2">
                          <Label>Dịch vụ</Label>
                          {loadingServices ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" /> Đang tải...
                            </div>
                          ) : (
                            <MultiSelectCombobox
                              options={services}
                              selectedIds={booth.serviceIds || []}
                              onSelectionChange={(ids) => updateBooth(boothIndex, { serviceIds: ids })}
                              placeholder="Tìm kiếm và chọn dịch vụ..."
                              loading={loadingServices}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                    Chưa có buồng nào. Nhấn "Thêm buồng" để thêm buồng khám.
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={onSubmit} disabled={submitting}>{submitting && <Loader2 className="size-4 animate-spin" />} Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      <Table className="rounded-lg ">
        <TableHeader>
          <TableRow className="bg-muted px-8">
            <TableHead className="px-4">Mã phòng</TableHead>
            <TableHead className="px-4">Tên phòng</TableHead>
            <TableHead className="px-4">Khoa</TableHead>
            <TableHead className="px-4">Mô tả</TableHead>
            <TableHead className="px-4">Địa chỉ</TableHead>
            <TableHead className="px-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id} className="px-4">
              <TableCell className="px-4">{r.roomCode}</TableCell>
              <TableCell className="px-4">{r.roomName}</TableCell>
              <TableCell className="px-4">{r.specialty ? `${r.specialty.name} (${r.specialty.specialtyCode})` : ""}</TableCell>
              <TableCell className="px-4">{r.description}</TableCell>
              <TableCell className="px-4">{r.address}</TableCell>
              <TableCell className="flex gap-2 px-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(r)}><Pencil className="size-4" /> Sửa</Button>
                <Button variant="outline"  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300" size="sm" onClick={() => onDelete(r)}><Trash2 className="size-4"  color="red"/> Xóa</Button>
              </TableCell>
            </TableRow>
          ))}
          {loading && (
            <TableRow>
              <TableCell colSpan={6}><div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Đang tải...</div></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls page={meta.page} totalPages={meta.totalPages} onPrev={() => setPage(Math.max(1, page - 1))} onNext={() => setPage(Math.min(meta.totalPages || 1, page + 1))} />
    </div>
  )
}

function BoothsTab() {
  const [roomFilter, setRoomFilter] = React.useState<string | undefined>(undefined)
  const [activeFilter, setActiveFilter] = React.useState<string | undefined>(undefined)

  const fetcher = React.useCallback(async (page: number, limit: number) => {
    return boothsService.listBooths(page, limit, roomFilter, activeFilter ? activeFilter === "true" : undefined)
  }, [roomFilter, activeFilter])
  const { data, meta, loading, error, page, setPage, reload } = usePaginatedList<Booth>(fetcher)

  const [rooms, setRooms] = React.useState<ClinicRoom[]>([])
  const [services, setServices] = React.useState<Service[]>([])
  const [loadingServices, setLoadingServices] = React.useState(false)

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await clinicRoomsService.listClinicRooms(1)
        setRooms(res.data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không tải được danh sách phòng")
      }
    })()
  }, [])

  React.useEffect(() => {
    void (async () => {
      setLoadingServices(true)
      try {
        const res = await servicesService.listServices({ isActive: "true" })
        setServices(res.data.services || [])
      } catch (e) {
        console.error("Failed to load services", e)
      } finally {
        setLoadingServices(false)
      }
    })()
  }, [])

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Booth | null>(null)
  const [form, setForm] = React.useState<{ 
    name: string
    roomId: string
    description?: string
    isActive: boolean
    serviceIds: string[]
  }>({ name: "", roomId: "", isActive: true, serviceIds: [] })
  const [submitting, setSubmitting] = React.useState(false)

  // State cho dialog quản lý dịch vụ
  const [servicesDialogOpen, setServicesDialogOpen] = React.useState(false)
  const [managingBooth, setManagingBooth] = React.useState<Booth | null>(null)
  const [boothServiceIds, setBoothServiceIds] = React.useState<string[]>([])
  const [loadingBoothServices, setLoadingBoothServices] = React.useState(false)
  const [savingBoothServices, setSavingBoothServices] = React.useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", roomId: "", description: "", isActive: true, serviceIds: [] })
    setOpen(true)
  }
  const openEdit = async (b: Booth) => {
    setEditing(b)
    try {
      const boothDetail = await boothsService.getBooth(b.id)
      const boothServices = await boothsService.getBoothServices(b.id)
      setForm({ 
        name: boothDetail.name, 
        roomId: boothDetail.roomId, 
        description: boothDetail.description ?? undefined, 
        isActive: boothDetail.isActive,
        serviceIds: boothServices.services.map(s => s.id)
      })
      setOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được thông tin buồng")
    }
  }


  const onSubmit = async () => {
    if (!form.name || !form.roomId) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    setSubmitting(true)
    try {
      const payload: any = {
        name: form.name,
        roomId: form.roomId,
        description: form.description,
        isActive: form.isActive,
        serviceIds: form.serviceIds
      }
      if (editing) {
        await boothsService.updateBooth(editing.id, payload)
        toast.success("Cập nhật buồng thành công")
      } else {
        await boothsService.createBooth(payload)
        toast.success("Tạo buồng thành công")
      }
      setOpen(false)
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (b: Booth) => {
    if (!confirm(`Xóa buồng "${b.name}"?`)) return
    try {
      await boothsService.deleteBooth(b.id)
      toast.success("Xóa buồng thành công")
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    }
  }

  const openServicesDialog = async (b: Booth) => {
    setManagingBooth(b)
    setLoadingBoothServices(true)
    setBoothServiceIds([])
    setServicesDialogOpen(true)
    try {
      const boothServices = await boothsService.getBoothServices(b.id)
      setBoothServiceIds(boothServices.services.map(s => s.id))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách dịch vụ")
    } finally {
      setLoadingBoothServices(false)
    }
  }

  const onSaveBoothServices = async () => {
    if (!managingBooth) return
    setSavingBoothServices(true)
    try {
      await boothsService.updateBoothServices(managingBooth.id, { serviceIds: boothServiceIds })
      toast.success("Cập nhật dịch vụ thành công")
      setServicesDialogOpen(false)
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSavingBoothServices(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={roomFilter} onValueChange={(v) => { setRoomFilter(v || undefined) }}>
            <SelectTrigger className="min-w-56"><SelectValue placeholder="Lọc theo phòng" /></SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>{`${r.roomName} (${r.roomCode})`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v || undefined) }}>
            <SelectTrigger className="min-w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Đang hoạt động</SelectItem>
              <SelectItem value="false">Ngừng hoạt động</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setRoomFilter(undefined); setActiveFilter(undefined); void reload() }} disabled={loading}>Bỏ lọc</Button>
          <Button variant="outline" onClick={() => reload()} disabled={loading}><RefreshCw className="size-4" /> Làm mới</Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="size-4" /> Thêm buồng</Button>
          </DialogTrigger>
          <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật buồng" : "Thêm buồng"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="boothName">Tên buồng *</Label>
                <Input id="boothName" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Phòng *</Label>
                <Select value={form.roomId} onValueChange={(v) => setForm((f) => ({ ...f, roomId: v }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{`${r.roomName} (${r.roomCode})`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="boothDesc">Mô tả</Label>
                <Input id="boothDesc" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select value={String(form.isActive ?? true)} onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === "true" }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Ngừng hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 border-t pt-4">
                <Label>Dịch vụ</Label>
                {loadingServices ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Đang tải...
                  </div>
                ) : (
                  <MultiSelectCombobox
                    options={services}
                    selectedIds={form.serviceIds}
                    onSelectionChange={(ids) => setForm((f) => ({ ...f, serviceIds: ids }))}
                    placeholder="Tìm kiếm và chọn dịch vụ..."
                    loading={loadingServices}
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={onSubmit} disabled={submitting}>{submitting && <Loader2 className="size-4 animate-spin" />} Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      <Table className="rounded-lg ">
        <TableHeader>
          <TableRow className="bg-muted px-8">
            <TableHead className="px-4">Mã buồng</TableHead>
            <TableHead className="px-4">Tên buồng</TableHead>
            <TableHead className="px-4">Phòng</TableHead>
            <TableHead className="px-4">Mô tả</TableHead>
            <TableHead className="px-4">Trạng thái</TableHead>
            <TableHead className="px-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((b) => (
            <TableRow key={b.id} className="px-4">
              <TableCell className="px-4">{b.boothCode}</TableCell>
              <TableCell className="px-4">{b.name}</TableCell>
              <TableCell className="px-4">{b.room ? `${b.room.roomName} (${b.room.roomCode})` : ""}</TableCell>
              <TableCell className="px-4">{b.description}</TableCell>
              <TableCell className="px-4">{b.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}</TableCell>
              <TableCell className="flex gap-2 px-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(b)}><Pencil className="size-4" /> Sửa</Button>
                <Button variant="outline" size="sm" onClick={() => openServicesDialog(b)}><Settings className="size-4" /> Dịch vụ</Button>
                <Button variant="outline"  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300" size="sm" onClick={() => onDelete(b)}><Trash2 className="size-4"  color="red"/> Xóa</Button>
              </TableCell>
            </TableRow>
          ))}
          {loading && (
            <TableRow>
              <TableCell colSpan={6}><div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Đang tải...</div></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls page={meta.page} totalPages={meta.totalPages} onPrev={() => setPage(Math.max(1, page - 1))} onNext={() => setPage(Math.min(meta.totalPages || 1, page + 1))} />

      {/* Dialog quản lý dịch vụ */}
      <Dialog open={servicesDialogOpen} onOpenChange={setServicesDialogOpen}>
        <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Quản lý dịch vụ - {managingBooth?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {loadingBoothServices ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="size-6 animate-spin" />
                <span className="ml-2">Đang tải danh sách dịch vụ...</span>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Chọn dịch vụ cho buồng</Label>
                  <MultiSelectCombobox
                    options={services}
                    selectedIds={boothServiceIds}
                    onSelectionChange={setBoothServiceIds}
                    placeholder="Tìm kiếm và chọn dịch vụ..."
                    loading={loadingServices}
                  />
                </div>
                {boothServiceIds.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Đã chọn {boothServiceIds.length} dịch vụ
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServicesDialogOpen(false)} disabled={savingBoothServices}>
              Hủy
            </Button>
            <Button onClick={onSaveBoothServices} disabled={savingBoothServices || loadingBoothServices}>
              {savingBoothServices && <Loader2 className="size-4 animate-spin mr-2" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PaginationControls({ page, totalPages, onPrev, onNext }: { page: number; totalPages: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-sm text-muted-foreground">Trang {page}/{totalPages || 1}</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
          <ChevronLeft className="size-4" /> Trước
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={totalPages ? page >= totalPages : true}>
          Sau <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}


