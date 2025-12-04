"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { serviceSearchApi, type Service } from "@/lib/services/services.service"

type ListResponse<T> = {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

type Specialty = {
  id: string
  specialtyCode: string
  name: string
  createdAt: string
  updatedAt: string
}

type ClinicRoom = {
  id: string
  roomCode: string
  roomName: string
  specialtyId: string
  specialty?: { id: string; name: string; specialtyCode: string }
  description: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

type Booth = {
  id: string
  boothCode: string
  name: string
  roomId: string
  room?: { id: string; roomCode: string; roomName: string; specialty?: { id: string; name: string; specialtyCode: string } }
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type ServiceSummary = {
  id: string
  serviceCode?: string | null
  name: string
}

type ServicePromotion = {
  id?: string
  serviceId: string
  service?: {
    id: string
    serviceCode?: string
    name?: string
  }
  name: string
  description?: string | null
  allowLoyaltyDiscount: boolean
  maxDiscountPercent?: number | null
  maxDiscountAmount?: number | null
  isActive: boolean
  startDate?: string | null
  endDate?: string | null
  createdAt?: string
  updatedAt?: string
}

type PromotionListMeta = {
  total?: number
  limit?: number
  offset?: number
}

type PromotionListNestedData = {
  data?: ServicePromotion[]
  items?: ServicePromotion[]
  promotions?: ServicePromotion[]
  meta?: PromotionListMeta
  pagination?: PromotionListMeta & { totalPages?: number; hasMore?: boolean }
}

type PromotionListApiResponse = {
  data: ServicePromotion[] | PromotionListNestedData
  meta?: PromotionListMeta
}

type PromotionFormState = {
  serviceId: string
  name: string
  description: string
  allowLoyaltyDiscount: boolean
  maxDiscountPercent: string
  maxDiscountAmount: string
  isActive: boolean
  startDate: string
  endDate: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const createEmptyPromotionForm = (): PromotionFormState => ({
  serviceId: "",
  name: "",
  description: "",
  allowLoyaltyDiscount: true,
  maxDiscountPercent: "",
  maxDiscountAmount: "",
  isActive: true,
  startDate: "",
  endDate: "",
})

const toDateTimeLocal = (value?: string | null): string => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const toIsoString = (value: string): string | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "Không giới hạn"
  const startLabel = start ? new Date(start).toLocaleDateString("vi-VN") : "Không giới hạn"
  const endLabel = end ? new Date(end).toLocaleDateString("vi-VN") : "Không giới hạn"
  return `${startLabel} → ${endLabel}`
}

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "—"
  return currencyFormatter.format(value)
}

const extractPromotionList = (payload: PromotionListApiResponse): { items: ServicePromotion[]; meta?: PromotionListMeta } => {
  if (Array.isArray(payload?.data)) {
    return { items: payload.data, meta: payload.meta }
  }

  const nested = payload?.data ?? {}
  const nestedItems = Array.isArray(nested.data)
    ? nested.data
    : Array.isArray(nested.items)
      ? nested.items
      : Array.isArray(nested.promotions)
        ? nested.promotions
        : []
  const meta = payload.meta ?? nested.meta ?? nested.pagination

  return { items: nestedItems, meta }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body?.message || JSON.stringify(body)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // ignore parse error
    }
    throw new Error(message)
  }
  // Some DELETEs may return 204 with body per guide; still try json
  try {
    return (await response.json()) as T
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return {} as T
  }
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
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="promotions">Khuyến mãi dịch vụ</TabsTrigger>
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
          <TabsContent value="promotions" className="mt-4">
            <PromotionsTab />
          </TabsContent>
        </Tabs>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  )
}

function SpecialtiesTab() {
  const fetcher = React.useCallback(async (page: number, limit: number) => {
    return apiFetch<ListResponse<Specialty>>(`/specialties?page=${page}&limit=${limit}`)
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
        await apiFetch<Specialty>(`/specialties/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        })
        toast.success("Cập nhật khoa thành công")
      } else {
        await apiFetch<Specialty>(`/specialties`, {
          method: "POST",
          body: JSON.stringify(form),
        })
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
      await apiFetch<{ message: string }>(`/specialties/${s.id}`, { method: "DELETE" })
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
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (specialtyFilter) params.set("specialtyId", specialtyFilter)
    return apiFetch<ListResponse<ClinicRoom>>(`/clinic-rooms?${params.toString()}`)
  }, [specialtyFilter])
  const { data, meta, loading, error, page, setPage, reload } = usePaginatedList<ClinicRoom>(fetcher)

  const [specialties, setSpecialties] = React.useState<Specialty[]>([])
  React.useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch<ListResponse<Specialty>>(`/specialties?page=1&limit=1000`)
        setSpecialties(res.data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không tải được danh sách khoa")
      }
    })()
  }, [])

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ClinicRoom | null>(null)
  const [form, setForm] = React.useState<{ roomName: string; specialtyId: string; description?: string; address?: string }>({ roomName: "", specialtyId: "" })
  const [submitting, setSubmitting] = React.useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ roomName: "", specialtyId: "" })
    setOpen(true)
  }
  const openEdit = (r: ClinicRoom) => {
    setEditing(r)
    setForm({ roomName: r.roomName, specialtyId: r.specialtyId, description: r.description ?? undefined, address: r.address ?? undefined })
    setOpen(true)
  }

  const onSubmit = async () => {
    if (!form.roomName || !form.specialtyId) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        await apiFetch<ClinicRoom>(`/clinic-rooms/${editing.id}`, { method: "PUT", body: JSON.stringify(form) })
        toast.success("Cập nhật phòng thành công")
      } else {
        await apiFetch<ClinicRoom>(`/clinic-rooms`, { method: "POST", body: JSON.stringify(form) })
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
      await apiFetch<{ message: string }>(`/clinic-rooms/${r.id}`, { method: "DELETE" })
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật phòng" : "Thêm phòng"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="grid gap-2">
                <Label htmlFor="roomName">Tên phòng</Label>
                <Input id="roomName" value={form.roomName} onChange={(e) => setForm((f) => ({ ...f, roomName: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Khoa</Label>
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
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (roomFilter) params.set("roomId", roomFilter)
    if (activeFilter) params.set("isActive", activeFilter)
    return apiFetch<ListResponse<Booth>>(`/booths?${params.toString()}`)
  }, [roomFilter, activeFilter])
  const { data, meta, loading, error, page, setPage, reload } = usePaginatedList<Booth>(fetcher)

  const [rooms, setRooms] = React.useState<ClinicRoom[]>([])
  React.useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch<ListResponse<ClinicRoom>>(`/clinic-rooms?page=1&limit=1000`)
        setRooms(res.data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không tải được danh sách phòng")
      }
    })()
  }, [])

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Booth | null>(null)
  const [form, setForm] = React.useState<{ name: string; roomId: string; description?: string; isActive?: boolean }>({ name: "", roomId: "", isActive: true })
  const [submitting, setSubmitting] = React.useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", roomId: "", description: "", isActive: true })
    setOpen(true)
  }
  const openEdit = (b: Booth) => {
    setEditing(b)
    setForm({ name: b.name, roomId: b.roomId, description: b.description ?? undefined, isActive: b.isActive })
    setOpen(true)
  }

  const onSubmit = async () => {
    if (!form.name || !form.roomId) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        await apiFetch<Booth>(`/booths/${editing.id}`, { method: "PUT", body: JSON.stringify(form) })
        toast.success("Cập nhật buồng thành công")
      } else {
        await apiFetch<Booth>(`/booths`, { method: "POST", body: JSON.stringify(form) })
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
      await apiFetch<{ message: string }>(`/booths/${b.id}`, { method: "DELETE" })
      toast.success("Xóa buồng thành công")
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật buồng" : "Thêm buồng"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="grid gap-2">
                <Label htmlFor="boothName">Tên buồng</Label>
                <Input id="boothName" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Phòng</Label>
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
    </div>
  )
}

function PromotionsTab() {
  const [limit] = React.useState(10)
  const [page, setPage] = React.useState(1)
  const [promotions, setPromotions] = React.useState<ServicePromotion[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "true" | "false">("all")
  const [loyaltyFilter, setLoyaltyFilter] = React.useState<"all" | "true" | "false">("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ServicePromotion | null>(null)
  const [form, setForm] = React.useState<PromotionFormState>(() => createEmptyPromotionForm())
  const [submitting, setSubmitting] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [selectedService, setSelectedService] = React.useState<ServiceSummary | null>(null)
  const [serviceSearchTerm, setServiceSearchTerm] = React.useState("")
  const [serviceSearchResults, setServiceSearchResults] = React.useState<ServiceSummary[]>([])
  const [serviceSearchLoading, setServiceSearchLoading] = React.useState(false)
  const [serviceSearchError, setServiceSearchError] = React.useState<string | null>(null)

  const totalPages = React.useMemo(() => {
    if (total === 0) return 1
    return Math.max(1, Math.ceil(total / limit))
  }, [limit, total])

  const loadPromotions = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
      })
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("isActive", statusFilter)
      if (loyaltyFilter !== "all") params.set("allowLoyaltyDiscount", loyaltyFilter)

      const res = await apiFetch<PromotionListApiResponse>(`/services/management/promotions?${params.toString()}`)
      const { items, meta } = extractPromotionList(res)
      setPromotions(items)
      const totalItems = meta?.total ?? items.length
      setTotal(totalItems)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách khuyến mãi")
    } finally {
      setLoading(false)
    }
  }, [limit, loyaltyFilter, page, search, statusFilter])

  React.useEffect(() => {
    void loadPromotions()
  }, [loadPromotions])

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handleApplySearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }

  const handleResetFilters = () => {
    setSearchInput("")
    setSearch("")
    setStatusFilter("all")
    setLoyaltyFilter("all")
    setPage(1)
  }

  React.useEffect(() => {
    if (!dialogOpen) return
    const keyword = serviceSearchTerm.trim()
    if (!keyword) {
      setServiceSearchResults([])
      setServiceSearchError(null)
      setServiceSearchLoading(false)
      return
    }

    let cancelled = false
    setServiceSearchLoading(true)
    setServiceSearchError(null)

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await serviceSearchApi.searchServices(keyword, 20)
        if (cancelled) return
        const services = response.data?.services ?? []
        setServiceSearchResults(
          services.map((service) => ({
            id: service.id,
            name: service.name,
            serviceCode: (service as Service).serviceCode,
          })),
        )
        if (services.length === 0) {
          setServiceSearchError("Không tìm thấy dịch vụ phù hợp")
        }
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : "Không thể tìm kiếm dịch vụ"
        setServiceSearchError(message)
        setServiceSearchResults([])
      } finally {
        if (!cancelled) {
          setServiceSearchLoading(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [dialogOpen, serviceSearchTerm])

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditing(null)
      setForm(createEmptyPromotionForm())
      setSelectedService(null)
      setServiceSearchTerm("")
      setServiceSearchError(null)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setSelectedService(null)
    setServiceSearchTerm("")
    setServiceSearchError(null)
    setForm(createEmptyPromotionForm())
    setDialogOpen(true)
  }

  const openEdit = (promotion: ServicePromotion) => {
    setEditing(promotion)
    setForm({
      serviceId: promotion.serviceId,
      name: promotion.name,
      description: promotion.description ?? "",
      allowLoyaltyDiscount: promotion.allowLoyaltyDiscount,
      maxDiscountPercent: promotion.maxDiscountPercent?.toString() ?? "",
      maxDiscountAmount: promotion.maxDiscountAmount?.toString() ?? "",
      isActive: promotion.isActive,
      startDate: toDateTimeLocal(promotion.startDate),
      endDate: toDateTimeLocal(promotion.endDate),
    })
    const serviceMeta = promotion.service
      ? {
          id: promotion.service.id,
          name: promotion.service.name ?? "",
          serviceCode: promotion.service.serviceCode ?? null,
        }
      : {
          id: promotion.serviceId,
          name: promotion.name,
          serviceCode: null,
        }
    setSelectedService(serviceMeta)
    setServiceSearchTerm(serviceMeta.name)
    setServiceSearchError(null)
    setDialogOpen(true)
  }

  const handleSelectService = (service: ServiceSummary) => {
    setSelectedService(service)
    setForm((prev) => ({
      ...prev,
      serviceId: service.id,
    }))
    setServiceSearchTerm(service.name)
  }

  const clearSelectedService = () => {
    setSelectedService(null)
    setForm((prev) => ({
      ...prev,
      serviceId: "",
    }))
    setServiceSearchTerm("")
  }

  const handleSubmit = async () => {
    if (!form.serviceId) {
      toast.error("Vui lòng chọn dịch vụ áp dụng")
      return
    }
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên chương trình")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        allowLoyaltyDiscount: form.allowLoyaltyDiscount,
        maxDiscountPercent: form.maxDiscountPercent ? Number(form.maxDiscountPercent) : null,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        isActive: form.isActive,
        startDate: toIsoString(form.startDate),
        endDate: toIsoString(form.endDate),
      }

      await apiFetch(`/services/management/services/${form.serviceId}/promotion`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      toast.success(editing ? "Cập nhật khuyến mãi thành công" : "Tạo khuyến mãi thành công")
      handleDialogOpenChange(false)
      await loadPromotions()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể lưu khuyến mãi")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (promotion: ServicePromotion) => {
    if (!confirm(`Xóa chương trình khuyến mãi cho dịch vụ "${promotion.service?.name ?? promotion.serviceId}"?`)) {
      return
    }
    setDeletingId(promotion.serviceId)
    try {
      await apiFetch(`/services/management/services/${promotion.serviceId}/promotion`, {
        method: "DELETE",
      })
      toast.success("Xóa khuyến mãi thành công")
      await loadPromotions()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể xóa khuyến mãi")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="min-w-64"
            placeholder="Tìm theo tên dịch vụ / chương trình"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleApplySearch()
              }
            }}
          />
          <Button variant="outline" onClick={handleApplySearch}>Tìm kiếm</Button>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as "all" | "true" | "false")
              setPage(1)
            }}
          >
            <SelectTrigger className="min-w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="true">Đang hoạt động</SelectItem>
              <SelectItem value="false">Ngừng hoạt động</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={loyaltyFilter}
            onValueChange={(value) => {
              setLoyaltyFilter(value as "all" | "true" | "false")
              setPage(1)
            }}
          >
            <SelectTrigger className="min-w-40">
              <SelectValue placeholder="Loyalty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Cho phép tích điểm</SelectItem>
              <SelectItem value="false">Không áp dụng loyalty</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleResetFilters}>Bỏ lọc</Button>
          <Button variant="outline" onClick={() => void loadPromotions()} disabled={loading}>
            <RefreshCw className="size-4" /> Làm mới
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Thêm khuyến mãi
            </Button>
          </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="serviceSearch">Chọn dịch vụ áp dụng</Label>
              <Input
                id="serviceSearch"
                placeholder="Nhập tên hoặc mã dịch vụ"
                value={serviceSearchTerm}
                onChange={(event) => setServiceSearchTerm(event.target.value)}
              />
              {serviceSearchError && !serviceSearchLoading && serviceSearchTerm.trim() && (
                <p className="text-sm text-destructive">{serviceSearchError}</p>
              )}
                <div className="rounded border bg-background max-h-48 overflow-auto">
                {serviceSearchLoading && (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Đang tìm dịch vụ...
                  </div>
                )}
                {!serviceSearchLoading && serviceSearchResults.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-muted ${
                      selectedService?.id === service.id ? "bg-muted" : ""
                    }`}
                    onClick={() => handleSelectService(service)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-xs text-muted-foreground">{service.serviceCode ?? service.id}</span>
                    </div>
                    {selectedService?.id === service.id && (
                      <span className="text-xs text-emerald-600">Đang chọn</span>
                    )}
                  </button>
                ))}
                  {!serviceSearchLoading && serviceSearchResults.length === 0 && serviceSearchTerm.trim() && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                      {serviceSearchError ?? "Không tìm thấy dịch vụ nào phù hợp"}
                  </div>
                )}
              </div>
              {selectedService ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-muted/50 p-3 text-sm">
                  <div>
                    <div className="font-medium">{selectedService.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedService.serviceCode ?? selectedService.id}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearSelectedService}>
                    Bỏ chọn
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nhập từ khóa để tìm và chọn dịch vụ áp dụng khuyến mãi.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promotionName">Tên chương trình</Label>
              <Input
                id="promotionName"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promotionDescription">Mô tả</Label>
              <Textarea
                id="promotionDescription"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="maxPercent">Giảm tối đa (%)</Label>
                <Input
                  id="maxPercent"
                  type="number"
                  min={0}
                  max={100}
                  value={form.maxDiscountPercent}
                  onChange={(event) => setForm((prev) => ({ ...prev, maxDiscountPercent: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxAmount">Giảm tối đa (VNĐ)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  min={0}
                  value={form.maxDiscountAmount}
                  onChange={(event) => setForm((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allowLoyalty"
                  checked={form.allowLoyaltyDiscount}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, allowLoyaltyDiscount: Boolean(checked) }))}
                />
                <Label htmlFor="allowLoyalty">Cho phép cộng/trừ ưu đãi loyalty</Label>
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select
                  value={form.isActive ? "true" : "false"}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value === "true" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Ngừng hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.serviceId}>
              {submitting && <Loader2 className="size-4 animate-spin" />} Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      <Table className="rounded-lg">
        <TableHeader>
          <TableRow className="bg-muted px-8">
            <TableHead className="px-4">Dịch vụ</TableHead>
            <TableHead className="px-4">Chương trình</TableHead>
            <TableHead className="px-4">Loyalty</TableHead>
            <TableHead className="px-4">Giảm tối đa (%)</TableHead>
            <TableHead className="px-4">Giảm tối đa (VNĐ)</TableHead>
            <TableHead className="px-4">Thời gian áp dụng</TableHead>
            <TableHead className="px-4">Trạng thái</TableHead>
            <TableHead className="px-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promotions.map((promotion) => (
            <TableRow key={`${promotion.serviceId}-${promotion.id ?? promotion.name}`} className="px-4">
              <TableCell className="px-4">
                <div className="flex flex-col">
                  <span className="font-medium">{promotion.service?.name ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">{promotion.service?.serviceCode ?? promotion.serviceId}</span>
                </div>
              </TableCell>
              <TableCell className="px-4">
                <div className="flex flex-col">
                  <span className="font-medium">{promotion.name}</span>
                  {promotion.description && (
                    <span className="text-sm text-muted-foreground line-clamp-2">{promotion.description}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4">
                <span className={promotion.allowLoyaltyDiscount ? "text-emerald-600" : "text-muted-foreground"}>
                  {promotion.allowLoyaltyDiscount ? "Cho phép" : "Không"}
                </span>
              </TableCell>
              <TableCell className="px-4">
                {promotion.maxDiscountPercent !== null && promotion.maxDiscountPercent !== undefined
                  ? `${promotion.maxDiscountPercent}%`
                  : "—"}
              </TableCell>
              <TableCell className="px-4">{formatCurrency(promotion.maxDiscountAmount)}</TableCell>
              <TableCell className="px-4">{formatDateRange(promotion.startDate, promotion.endDate)}</TableCell>
              <TableCell className="px-4">
                <span className={`text-sm font-medium ${promotion.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {promotion.isActive ? "Đang hoạt động" : "Ngừng"}
                </span>
              </TableCell>
              <TableCell className="flex gap-2 px-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(promotion)}>
                  <Pencil className="size-4" /> Sửa
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                  size="sm"
                  onClick={() => void handleDelete(promotion)}
                  disabled={deletingId === promotion.serviceId}
                >
                  {deletingId === promotion.serviceId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" color="red" />
                  )}{" "}
                  Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && promotions.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="py-6 text-center text-muted-foreground">Chưa có chương trình khuyến mãi nào</div>
              </TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Đang tải...</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage(Math.max(1, page - 1))}
        onNext={() => setPage(Math.min(totalPages, page + 1))}
      />
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


