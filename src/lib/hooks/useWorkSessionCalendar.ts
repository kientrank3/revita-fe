/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkSessionManagement } from './useWorkSessionManagement';
import { serviceApi, workSessionApi } from '@/lib/api';
import {
  WorkSession,
  CalendarEvent,
  WorkSessionStatusColors,
  Service,
  WorkSessionFormData,
} from '@/lib/types/work-session';

interface UseWorkSessionCalendarOptions {
  selectedDoctorId?: string | null;
  isAdmin?: boolean;
  // Prevent initial fetch until auth/role is determined by caller
  isReady?: boolean;
}

export const useWorkSessionCalendar = (options: UseWorkSessionCalendarOptions = {}) => {
  const { selectedDoctorId, isAdmin = false, isReady = true } = options;
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
        const response = await serviceApi.getAll();
        // Handle API response structure: { success, message, data: { services: [...] } }
        const servicesData = response.data?.data?.services || response.data?.services || response.data || [];
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
      // Avoid fetching until auth/role is ready
      if (!isReady) return;
      const start = startDate || new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const end = endDate || new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      let response;
      
      if (isAdmin && selectedDoctorId) {
        // Admin viewing specific doctor's schedule
        response = await workSessionApi.getUserWorkSessions(selectedDoctorId, {
          userType: 'DOCTOR',
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        });
      } else if (isAdmin) {
        // Admin viewing all work sessions
        response = await workSessionApi.getAll({
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        });
      } else {
        // Regular user viewing their own schedule
        response = await getMySchedule({
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        });
      }
      
      // Handle work session response structure
      const workSessionsData = response.data || response || [];
      setWorkSessions(Array.isArray(workSessionsData) ? workSessionsData : []);
    } catch (err) {
      console.error('Failed to load work sessions:', err);
    }
  }, [selectedDate, getMySchedule, isAdmin, selectedDoctorId, isReady]);

  // Load events with custom date range for calendar
  const loadEvents = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      // Avoid fetching until auth/role is ready
      if (!isReady) return;
      
      let response;
      
      if (isAdmin && selectedDoctorId) {
        // Admin viewing specific doctor's schedule
        response = await workSessionApi.getUserWorkSessions(selectedDoctorId, {
          userType: 'DOCTOR',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        });
      } else if (isAdmin) {
        // Admin viewing all work sessions
        response = await workSessionApi.getAll({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        });
      } else {
        // Regular user viewing their own schedule
        response = await getMySchedule({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        });
      }
      
      // Handle work session response structure
      const workSessionsData = response.data || response || [];
      const sessions = Array.isArray(workSessionsData) ? workSessionsData : [];
      
      // Convert to calendar events
      const events = sessions.map((session: WorkSession) => {
        const statusColors = WorkSessionStatusColors[session.status];
        
        // Handle new service structure: array of {serviceId, workSessionId, service: {...}}
        const serviceNames = session.services
          .map(serviceItem => serviceItem.service?.name || 'Unknown Service')
          .join(', ');
        
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
      
      return events;
    } catch (err) {
      console.error('Failed to load events:', err);
      return [];
    }
  }, [getMySchedule, isAdmin, selectedDoctorId, isReady]);

  // Load work sessions when component mounts or date changes
  useEffect(() => {
    loadWorkSessions();
  }, [loadWorkSessions]);

  // Convert work sessions to calendar events
  const calendarEvents = useMemo((): CalendarEvent[] => {
    return workSessions.map((session) => {
      const statusColors = WorkSessionStatusColors[session.status];
      
      // Handle new service structure: array of {serviceId, workSessionId, service: {...}}
      const serviceNames = session.services
        .map(serviceItem => serviceItem.service?.name || 'Unknown Service')
        .join(', ');
      
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

  // Admin-specific functions
  const handleUpdateWorkSessionStatus = useCallback(async (sessionId: string, status: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workSessionApi.update(sessionId, { status: status as any });
    await loadWorkSessions();
  }, [loadWorkSessions]);

  const handleCreateWorkSessionForUser = useCallback(async (formData: WorkSessionFormData, userId: string) => {
    const sessionDate = new Date(formData.date);
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    const createData = {
      workSessions: [{
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        serviceIds: formData.serviceIds,
      }],
    };

    await workSessionApi.create(createData);
    await loadWorkSessions();
  }, [loadWorkSessions]);

  const handleUpdateWorkSessionForUser = useCallback(async (
    sessionId: string, 
    updateData: Partial<WorkSessionFormData>,
    userId: string
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

      updatePayload.startTime = startDateTime.toISOString();
      updatePayload.endTime = endDateTime.toISOString();
    }

    if (updateData.serviceIds) {
      updatePayload.serviceIds = updateData.serviceIds;
    }

    await workSessionApi.update(sessionId, updatePayload);
    await loadWorkSessions();
  }, [workSessions, loadWorkSessions]);

  const handleDeleteWorkSessionForUser = useCallback(async (sessionId: string, userId: string) => {
    await workSessionApi.delete(sessionId);
    await loadWorkSessions();
  }, [loadWorkSessions]);

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
    loadEvents,
    
    // Admin-specific functions
    handleUpdateWorkSessionStatus,
    handleCreateWorkSessionForUser,
    handleUpdateWorkSessionForUser,
    handleDeleteWorkSessionForUser,
  };
};
