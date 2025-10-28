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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"

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
          <h1 className="text-xl font-semibold">Quản lý cơ sở khám chữa bệnh</h1>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList>
            <TabsTrigger value="specialties">Khoa chuyên môn</TabsTrigger>
            <TabsTrigger value="rooms">Phòng chức năng</TabsTrigger>
            <TabsTrigger value="booths">Buồng khám</TabsTrigger>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã khoa</TableHead>
            <TableHead>Tên khoa</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.specialtyCode}</TableCell>
              <TableCell>{s.name}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                  <Pencil className="size-4" /> Sửa
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(s)}>
                  <Trash2 className="size-4" /> Xóa
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã phòng</TableHead>
            <TableHead>Tên phòng</TableHead>
            <TableHead>Khoa</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead>Địa chỉ</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.roomCode}</TableCell>
              <TableCell>{r.roomName}</TableCell>
              <TableCell>{r.specialty ? `${r.specialty.name} (${r.specialty.specialtyCode})` : ""}</TableCell>
              <TableCell>{r.description}</TableCell>
              <TableCell>{r.address}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(r)}><Pencil className="size-4" /> Sửa</Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(r)}><Trash2 className="size-4" /> Xóa</Button>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã buồng</TableHead>
            <TableHead>Tên buồng</TableHead>
            <TableHead>Phòng</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((b) => (
            <TableRow key={b.id}>
              <TableCell>{b.boothCode}</TableCell>
              <TableCell>{b.name}</TableCell>
              <TableCell>{b.room ? `${b.room.roomName} (${b.room.roomCode})` : ""}</TableCell>
              <TableCell>{b.description}</TableCell>
              <TableCell>{b.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(b)}><Pencil className="size-4" /> Sửa</Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(b)}><Trash2 className="size-4" /> Xóa</Button>
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


