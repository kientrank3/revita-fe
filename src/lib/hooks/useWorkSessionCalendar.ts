import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkSessionManagement } from './useWorkSessionManagement';
import { serviceApi } from '@/lib/api';
import {
  WorkSession,
  CalendarEvent,
  WorkSessionStatusColors,
  Service,
  WorkSessionFormData,
} from '@/lib/types/work-session';

export const useWorkSessionCalendar = () => {
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  const {
    loading,
    error,
    clearError,
    getMySchedule,
    createWorkSessions,
    updateWorkSession,
    deleteWorkSession,
    validateTimeConflicts,
  } = useWorkSessionManagement();

  // Load available services on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await serviceApi.getAll({ limit: 100 });
        // Handle different possible response structures
        const servicesData = response.data?.data || response.data || [];
        setServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (err) {
        console.error('Failed to load services:', err);
        setServices([]); // Ensure services is always an array
      }
    };
    loadServices();
  }, []);

  // Load work sessions when date changes
  const loadWorkSessions = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      const start = startDate || new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const end = endDate || new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const response = await getMySchedule({
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      });
      
      setWorkSessions(response.data || []);
    } catch (err) {
      console.error('Failed to load work sessions:', err);
    }
  }, [selectedDate, getMySchedule]);

  // Load work sessions when component mounts or date changes
  useEffect(() => {
    loadWorkSessions();
  }, [loadWorkSessions]);

  // Convert work sessions to calendar events
  const calendarEvents = useMemo((): CalendarEvent[] => {
    return workSessions.map((session) => {
      const statusColors = WorkSessionStatusColors[session.status];
      const serviceNames = session.services.map(s => s.name).join(', ');
      
      return {
        id: session.id,
        title: `${serviceNames}${session.booth ? ` - ${session.booth.name}` : ''}`,
        start: session.startTime,
        end: session.endTime,
        backgroundColor: statusColors.backgroundColor,
        borderColor: statusColors.borderColor,
        textColor: statusColors.textColor,
        extendedProps: {
          workSession: session,
          status: session.status,
          services: session.services,
          booth: session.booth,
        },
      };
    });
  }, [workSessions]);

  // Create new work session
  const handleCreateWorkSession = useCallback(async (formData: WorkSessionFormData) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sessionDate = new Date(formData.date);
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    // Validate time conflicts
    const validation = validateTimeConflicts(
      {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      },
      workSessions
    );

    if (validation.hasConflict) {
      throw new Error(validation.message || 'Có xung đột về thời gian');
    }

    const createData = {
      workSessions: [{
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        serviceIds: formData.serviceIds,
      }],
    };

    await createWorkSessions(createData);
    await loadWorkSessions();
  }, [createWorkSessions, validateTimeConflicts, workSessions, loadWorkSessions]);

  // Update work session
  const handleUpdateWorkSession = useCallback(async (
    sessionId: string, 
    updateData: Partial<WorkSessionFormData>
  ) => {
    const session = workSessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Không tìm thấy lịch làm việc');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};

    if (updateData.startTime || updateData.endTime || updateData.date) {
      const currentStart = new Date(session.startTime);
      const currentEnd = new Date(session.endTime);
      
      const date = updateData.date || currentStart.toISOString().split('T')[0];
      const startTime = updateData.startTime || currentStart.toTimeString().slice(0, 5);
      const endTime = updateData.endTime || currentEnd.toTimeString().slice(0, 5);

      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      // Validate time conflicts (excluding current session)
      const validation = validateTimeConflicts(
        {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        },
        workSessions,
        sessionId
      );

      if (validation.hasConflict) {
        throw new Error(validation.message || 'Có xung đột về thời gian');
      }

      updatePayload.startTime = startDateTime.toISOString();
      updatePayload.endTime = endDateTime.toISOString();
    }

    if (updateData.serviceIds) {
      updatePayload.serviceIds = updateData.serviceIds;
    }

    await updateWorkSession(sessionId, updatePayload);
    await loadWorkSessions();
  }, [updateWorkSession, validateTimeConflicts, workSessions, loadWorkSessions]);

  // Delete work session
  const handleDeleteWorkSession = useCallback(async (sessionId: string) => {
    await deleteWorkSession(sessionId);
    await loadWorkSessions();
  }, [deleteWorkSession, loadWorkSessions]);

  // Get work sessions for a specific date
  const getSessionsForDate = useCallback((date: Date): WorkSession[] => {
    const targetDate = date.toISOString().split('T')[0];
    return workSessions.filter(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      return sessionDate === targetDate;
    });
  }, [workSessions]);

  // Check if a time slot is available
  const isTimeSlotAvailable = useCallback((
    date: string, 
    startTime: string, 
    endTime: string,
    excludeId?: string
  ): boolean => {
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    const validation = validateTimeConflicts(
      {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      },
      workSessions,
      excludeId
    );

    return !validation.hasConflict;
  }, [validateTimeConflicts, workSessions]);

  // Refresh calendar data
  const refreshCalendar = useCallback(async () => {
    await loadWorkSessions();
  }, [loadWorkSessions]);

  return {
    // State
    workSessions,
    services,
    calendarEvents,
    selectedDate,
    viewMode,
    loading,
    error,
    
    // Actions
    setSelectedDate,
    setViewMode,
    clearError,
    handleCreateWorkSession,
    handleUpdateWorkSession,
    handleDeleteWorkSession,
    getSessionsForDate,
    isTimeSlotAvailable,
    refreshCalendar,
    loadWorkSessions,
  };
};
