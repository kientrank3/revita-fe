'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarStats } from '@/components/calendar/CalendarStats';
import { CalendarErrorDisplay } from '@/components/calendar/CalendarErrorDisplay';
import { WorkSessionCalendar } from '@/components/calendar/WorkSessionCalendar';
import { WorkSessionForm } from '@/components/calendar/WorkSessionForm';
import { WorkSessionDetails } from '@/components/calendar/WorkSessionDetails';
import { useWorkSessionCalendar } from '@/lib/hooks/useWorkSessionCalendar';
import { WorkSession, WorkSessionFormData } from '@/lib/types/work-session';

export default function CalendarPage() {
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<WorkSession | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    workSessions,
    services,
    calendarEvents,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectedDate: currentDate,
    viewMode,
    loading,
    error,
    setViewMode,
    clearError,
    handleCreateWorkSession,
    handleUpdateWorkSession,
    handleDeleteWorkSession,
    refreshCalendar,
  } = useWorkSessionCalendar();

  // Handle calendar event click
  const handleEventClick = (workSession: WorkSession) => {
    setSelectedSession(workSession);
    setShowDetails(true);
  };

  // Handle date selection for creating new session
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDateSelect = (date: Date, allDay: boolean) => {
    setSelectedDate(date);
    setEditingSession(null);
    setShowForm(true);
  };

  // Handle form submission
  const handleFormSubmit = async (formData: WorkSessionFormData) => {
    try {
      if (editingSession) {
        await handleUpdateWorkSession(editingSession.id, formData);
        toast.success('Cập nhật lịch làm việc thành công!');
      } else {
        await handleCreateWorkSession(formData);
        toast.success('Tạo lịch làm việc thành công!');
      }
      setShowForm(false);
      setEditingSession(null);
      setSelectedDate(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  };

  // Handle edit session
  const handleEditSession = (session: WorkSession) => {
    setEditingSession(session);
    setShowDetails(false);
    setShowForm(true);
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await handleDeleteWorkSession(sessionId);
      toast.success('Xóa lịch làm việc thành công!');
      setShowDetails(false);
      setSelectedSession(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa');
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshCalendar();
      toast.success('Cập nhật dữ liệu thành công!');
    } catch (err) {
      console.error('Failed to refresh calendar:', err);
      toast.error('Có lỗi xảy ra khi cập nhật dữ liệu');
    }
  };


  const handleCreateNew = () => {
    setSelectedDate(new Date());
    setEditingSession(null);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col gap-6 px-8 py-6">
        {/* Header */}
        <CalendarHeader
          loading={loading}
          onRefresh={handleRefresh}
          onCreateNew={handleCreateNew}
        />

        {/* Error Display */}
        {error && (
          <CalendarErrorDisplay
            error={error}
            onClear={clearError}
            onRetry={handleRefresh}
          />
        )}

        {/* Main Layout: Calendar + Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
          {/* Calendar - Main Content (3/4 width on xl screens) */}
          <div className="xl:col-span-6">
            <WorkSessionCalendar
              events={calendarEvents}
              loading={loading}
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
              view={viewMode}
              onViewChange={setViewMode}
              height="calc(120vh - 400px)"
            />
          </div>

          {/* Sidebar - Statistics (1/4 width on xl screens) */}
          
        </div>
        <div className=" gap-6">
            <CalendarStats workSessions={workSessions} services={services} showOnlyStats={true} viewMode={viewMode} />
          </div>
        {/* Bottom Modules - Services & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
          <CalendarStats workSessions={workSessions} services={services} showOnlyServices={true} />
          <CalendarStats workSessions={workSessions} services={services} showOnlyStatus={true} />
        </div>
      </div>

      {/* Modals */}
      <WorkSessionForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingSession(null);
          setSelectedDate(null);
        }}
        onSubmit={handleFormSubmit}
        editingSession={editingSession}
        selectedDate={selectedDate || undefined}
        loading={loading}
      />

      <WorkSessionDetails
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedSession(null);
        }}
        workSession={selectedSession}
        onEdit={handleEditSession}
        onDelete={handleDeleteSession}
        loading={loading}
        canEdit={true}
        canDelete={true}
        canChangeStatus={false} // Only admin can change status
      />
    </div>
  );
}
