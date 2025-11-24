const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"

// Types
export type Specialty = {
  id: string
  specialtyCode: string
  name: string
  createdAt: string
  updatedAt: string
}

export type ClinicRoom = {
  id: string
  roomCode: string
  roomName: string
  specialtyId: string
  specialty?: { id: string; name: string; specialtyCode: string }
  description: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  services?: Array<{
    id: string
    serviceCode: string
    name: string
    price: number
  }>
  booths?: Booth[]
}

export type Booth = {
  id: string
  boothCode: string
  name: string
  roomId: string
  room?: { id: string; roomCode: string; roomName: string; specialty?: { id: string; name: string; specialtyCode: string } }
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  services?: Array<{
    id: string
    serviceCode: string
    name: string
    price: number
  }>
}

export type ListResponse<T> = {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export type CreateSpecialtyDto = {
  specialtyCode: string
  name: string
}

export type UpdateSpecialtyDto = Partial<CreateSpecialtyDto>

export type CreateClinicRoomDto = {
  roomName: string
  specialtyId: string
  description?: string | null
  address?: string | null
  booths?: Array<{
    name: string
    description?: string | null
    isActive?: boolean
    serviceIds?: string[]
  }>
}

export type UpdateClinicRoomDto = {
  roomName?: string
  specialtyId?: string
  description?: string | null
  address?: string | null
  booths?: Array<{
    id?: string // Nếu có id => cập nhật, nếu không => tạo mới
    name: string
    description?: string | null
    isActive?: boolean
    serviceIds?: string[]
  }>
}

export type CreateBoothDto = {
  name: string
  roomId: string
  description?: string | null
  isActive?: boolean
  serviceIds?: string[]
}

export type UpdateBoothDto = {
  name?: string
  roomId?: string
  description?: string | null
  isActive?: boolean
  serviceIds?: string[]
}

export type CommonServicesResponse = {
  services: Array<{
    id: string
    serviceCode: string
    name: string
    price: number
  }>
}

export type BoothServicesResponse = {
  services: Array<{
    id: string
    serviceCode: string
    name: string
    price: number
  }>
}

export type UpdateCommonServicesDto = {
  serviceIds: string[]
}

export type UpdateBoothServicesDto = {
  serviceIds: string[]
}

// Helper function
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
    } catch (_) {
      // ignore parse error
    }
    throw new Error(message)
  }
  // Some DELETEs may return 204 with body per guide; still try json
  try {
    return (await response.json()) as T
  } catch (_) {
    return {} as T
  }
}

// Specialties API
export const specialtiesService = {
  async listSpecialties(page = 1, limit?: number): Promise<ListResponse<Specialty>> {
    const params = new URLSearchParams({ page: String(page) })
    if (limit !== undefined) params.set("limit", String(limit))
    return apiFetch<ListResponse<Specialty>>(`/specialties?${params.toString()}`)
  },

  async getSpecialty(id: string): Promise<Specialty> {
    return apiFetch<Specialty>(`/specialties/${id}`)
  },

  async createSpecialty(data: CreateSpecialtyDto): Promise<Specialty> {
    return apiFetch<Specialty>(`/specialties`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateSpecialty(id: string, data: UpdateSpecialtyDto): Promise<Specialty> {
    return apiFetch<Specialty>(`/specialties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async deleteSpecialty(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/specialties/${id}`, {
      method: "DELETE",
    })
  },
}

// Clinic Rooms API
export const clinicRoomsService = {
  async listClinicRooms(page = 1, limit?: number, specialtyId?: string): Promise<ListResponse<ClinicRoom>> {
    const params = new URLSearchParams({ page: String(page) })
    if (limit !== undefined) params.set("limit", String(limit))
    if (specialtyId) params.set("specialtyId", specialtyId)
    return apiFetch<ListResponse<ClinicRoom>>(`/clinic-rooms?${params.toString()}`)
  },

  async getClinicRoom(id: string): Promise<ClinicRoom> {
    return apiFetch<ClinicRoom>(`/clinic-rooms/${id}`)
  },

  async createClinicRoom(data: CreateClinicRoomDto): Promise<ClinicRoom> {
    return apiFetch<ClinicRoom>(`/clinic-rooms`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateClinicRoom(id: string, data: UpdateClinicRoomDto): Promise<ClinicRoom> {
    return apiFetch<ClinicRoom>(`/clinic-rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async deleteClinicRoom(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/clinic-rooms/${id}`, {
      method: "DELETE",
    })
  },

  async getCommonServices(roomId: string): Promise<CommonServicesResponse> {
    return apiFetch<CommonServicesResponse>(`/clinic-rooms/${roomId}/common-services`)
  },

  async updateCommonServices(roomId: string, data: UpdateCommonServicesDto): Promise<{ message: string; updatedBooths: number }> {
    return apiFetch<{ message: string; updatedBooths: number }>(`/clinic-rooms/${roomId}/common-services`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },
}

// Booths API
export const boothsService = {
  async listBooths(page = 1, limit?: number, roomId?: string, isActive?: boolean): Promise<ListResponse<Booth>> {
    const params = new URLSearchParams({ page: String(page) })
    if (limit !== undefined) params.set("limit", String(limit))
    if (roomId) params.set("roomId", roomId)
    if (isActive !== undefined) params.set("isActive", String(isActive))
    return apiFetch<ListResponse<Booth>>(`/booths?${params.toString()}`)
  },

  async getBooth(id: string): Promise<Booth> {
    return apiFetch<Booth>(`/booths/${id}`)
  },

  async createBooth(data: CreateBoothDto): Promise<Booth> {
    return apiFetch<Booth>(`/booths`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateBooth(id: string, data: UpdateBoothDto): Promise<Booth> {
    return apiFetch<Booth>(`/booths/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async deleteBooth(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/booths/${id}`, {
      method: "DELETE",
    })
  },

  async getBoothServices(boothId: string): Promise<BoothServicesResponse> {
    return apiFetch<BoothServicesResponse>(`/booths/${boothId}/services`)
  },

  async updateBoothServices(boothId: string, data: UpdateBoothServicesDto): Promise<{ message: string; booth: Booth }> {
    return apiFetch<{ message: string; booth: Booth }>(`/booths/${boothId}/services`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },
}

