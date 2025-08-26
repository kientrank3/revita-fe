# Medical Records Management System

Hệ thống quản lý bệnh án điện tử với các template động, hỗ trợ tạo, xem, chỉnh sửa và xóa bệnh án.

## Các Component Chính

### 1. MedicalRecordManager
Component chính để quản lý bệnh án với đầy đủ chức năng CRUD.

```tsx
import { MedicalRecordManager } from '@/components/medical-records/MedicalRecordManager';

<MedicalRecordManager 
  patientProfileId="patient-123"
  doctorId="doctor-456"
  appointmentId="appointment-789"
/>
```

### 2. DynamicMedicalRecordForm
Form động để tạo và chỉnh sửa bệnh án dựa trên template.

```tsx
import { DynamicMedicalRecordForm } from '@/components/medical-records/DynamicMedicalRecordForm';

<DynamicMedicalRecordForm
  template={template}
  patientProfileId="patient-123"
  doctorId="doctor-456"
  appointmentId="appointment-789"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  initialData={existingData}
  isEditing={true}
/>
```

### 3. MedicalRecordViewer
Component để hiển thị chi tiết bệnh án với layout đẹp.

```tsx
import { MedicalRecordViewer } from '@/components/medical-records/MedicalRecordViewer';

<MedicalRecordViewer
  medicalRecord={record}
  template={template}
  onEdit={handleEdit}
  onPrint={handlePrint}
  onDownload={handleDownload}
/>
```

### 4. MedicalRecordList
Component danh sách bệnh án với tìm kiếm, lọc và phân trang.

```tsx
import { MedicalRecordList } from '@/components/medical-records/MedicalRecordList';

<MedicalRecordList
  medicalRecords={records}
  templates={templates}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onCreate={handleCreate}
  isLoading={isLoading}
/>
```

## Types và Interfaces

### MedicalRecord
```tsx
interface MedicalRecord {
  id: string;
  patientProfileId: string;
  templateId: string;
  doctorId?: string;
  appointmentId?: string;
  status: MedicalRecordStatus;
  content: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

### Template
```tsx
interface Template {
  templateCode: string;
  name: string;
  specialtyName: string;
  fields: {
    fields: FieldDefinition[];
  };
}
```

### FieldDefinition
```tsx
interface FieldDefinition {
  name: string;
  label: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required?: boolean;
  properties?: Record<string, any>;
  items?: {
    type: string;
    properties?: Record<string, any>;
  };
}
```

## Các Loại Field Hỗ Trợ

### 1. String Field
```tsx
{
  name: 'chief_complaint',
  label: 'Triệu chứng chính',
  type: 'string',
  required: true,
}
```

### 2. Text Field
```tsx
{
  name: 'hpi',
  label: 'Diễn tiến bệnh',
  type: 'text'
}
```

### 3. Number Field
```tsx
{
  name: 'temperature',
  label: 'Nhiệt độ',
  type: 'number'
}
```

### 4. Boolean Field
```tsx
{
  name: 'is_emergency',
  label: 'Cấp cứu',
  type: 'boolean'
}
```

### 5. Date Field
```tsx
{
  name: 'procedure_date',
  label: 'Ngày thực hiện',
  type: 'date'
}
```

### 6. Object Field (Vital Signs)
```tsx
{
  name: 'vital_signs',
  label: 'Dấu hiệu sinh tồn',
  type: 'object',
  properties: {
    temp: { type: 'number' },
    bp: { type: 'string' },
    hr: { type: 'number' },
    rr: { type: 'number' },
  },
}
```

### 7. Array Field (Attachments)
```tsx
{
  name: 'attachments',
  label: 'Tệp đính kèm',
  type: 'array',
  items: {
    type: 'object',
    properties: {
      filename: { type: 'string' },
      filetype: { type: 'string' },
      url: { type: 'string' },
    },
  },
}
```

## Service và API Integration

### MedicalRecordService
```tsx
import { medicalRecordService } from '@/lib/services/medical-record.service';

// Get all records
const records = await medicalRecordService.getAll();

// Get by patient profile
const records = await medicalRecordService.getByPatientProfile(patientId);

// Create new record
const newRecord = await medicalRecordService.create(data);

// Update record
const updatedRecord = await medicalRecordService.update(id, data);

// Delete record
await medicalRecordService.delete(id);

// Get templates
const templates = await medicalRecordService.getTemplates();
```

### Custom Hook
```tsx
import { useMedicalRecords } from '@/lib/hooks/useMedicalRecords';

const {
  medicalRecords,
  templates,
  isLoading,
  error,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  refresh,
} = useMedicalRecords({
  patientProfileId: 'patient-123',
  autoLoad: true,
});
```

## Cách Sử Dụng

### 1. Tích hợp vào trang
```tsx
'use client';

import { MedicalRecordManager } from '@/components/medical-records/MedicalRecordManager';

export default function PatientPage() {
  return (
    <div className="container mx-auto py-8">
      <h1>Quản lý bệnh án bệnh nhân</h1>
      <MedicalRecordManager 
        patientProfileId="patient-123"
        doctorId="doctor-456"
      />
    </div>
  );
}
```

### 2. Sử dụng với API Backend
```tsx
// Cấu hình API URL trong .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001

// Service sẽ tự động gọi API với authentication
const token = localStorage.getItem('authToken');
// Headers: Authorization: Bearer ${token}
```

### 3. Tùy chỉnh Template
```tsx
const customTemplate: Template = {
  templateCode: 'CUSTOM_TEMPLATE',
  name: 'Template tùy chỉnh',
  specialtyName: 'Chuyên khoa tùy chỉnh',
  fields: {
    fields: [
      // Định nghĩa các field tùy chỉnh
    ],
  },
};
```

## Tính Năng

- ✅ Form động dựa trên template
- ✅ Validation tự động cho các field bắt buộc
- ✅ Hỗ trợ nhiều loại field (string, text, number, boolean, date, object, array)
- ✅ Tìm kiếm và lọc bệnh án
- ✅ Phân trang
- ✅ In và tải xuống bệnh án
- ✅ Responsive design
- ✅ Error handling và loading states
- ✅ Toast notifications
- ✅ TypeScript support

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Sonner (toast notifications)
- shadcn/ui components

## Authentication

Hệ thống sử dụng JWT authentication với các endpoints:

### Auth Endpoints
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký
- `GET /auth/me` - Lấy thông tin user hiện tại
- `PUT /auth/me` - Cập nhật thông tin user

### Auth Service
```tsx
import { authService } from '@/lib/services/auth.service';

// Login
const { token, user } = await authService.login(email, password);

// Get current user
const user = await authService.getMe();

// Update profile
const updatedUser = await authService.updateMe({ name, email });

// Logout
authService.logout();
```

### Auth Hook
```tsx
import { useAuth } from '@/lib/hooks/useAuth';

const {
  user,
  isLoading,
  isAuthenticated,
  login,
  logout,
  updateProfile,
} = useAuth();
```

## Backend API Endpoints

Hệ thống được thiết kế để tích hợp với NestJS backend với các endpoints:

### Medical Records
- `GET /medical-records` - Lấy tất cả bệnh án
- `GET /medical-records/patient-profile/:id` - Lấy bệnh án theo bệnh nhân
- `GET /medical-records/:id` - Lấy bệnh án theo ID
- `POST /medical-records` - Tạo bệnh án mới
- `PATCH /medical-records/:id` - Cập nhật bệnh án
- `DELETE /medical-records/:id` - Xóa bệnh án
- `GET /medical-records/templates` - Lấy tất cả template
- `GET /medical-records/templates/:id` - Lấy template theo ID

### Authentication Required
Tất cả các endpoints đều yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```
