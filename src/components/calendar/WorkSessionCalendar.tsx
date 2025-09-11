'use client';

import { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEvent, WorkSession } from '@/lib/types/work-session';

// Helper function to get FullCalendar view type
const getViewType = (view: 'month' | 'week' | 'day') => {
  switch (view) {
    case 'month':
      return 'dayGridMonth';
    case 'week':
      return 'timeGridWeek';
    case 'day':
      return 'timeGridDay';
    default:
      return 'dayGridMonth';
  }
};

interface WorkSessionCalendarProps {
  events: CalendarEvent[];
  loading?: boolean;
  onEventClick?: (event: WorkSession) => void;
  onDateSelect?: (date: Date, allDay: boolean) => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  height?: string | number;
}

export function WorkSessionCalendar({
  events,
  loading = false,
  onEventClick,
  onDateSelect,
  onEventDrop,
  view = 'month',
  onViewChange,
  height = '100%',
}: WorkSessionCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>(view);

  // Update title when calendar is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        setCurrentTitle(calendarApi.view.title);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [view]);

  // Sync view with FullCalendar when prop changes
  useEffect(() => {
    setCurrentView(view);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const currentViewType = calendarApi.view.type;
      const expectedViewType = getViewType(view);
      
      if (currentViewType !== expectedViewType) {
        calendarApi.changeView(expectedViewType);
        setCurrentTitle(calendarApi.view.title);
      }
    }
  }, [view]);

  // Navigation functions
  const goToPrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  const goToNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  const goToToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  // View change function
  const handleViewChange = (newView: 'month' | 'week' | 'day') => {
    console.log('Changing view to:', newView);
    setCurrentView(newView);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const viewType = getViewType(newView);
      console.log('FullCalendar view type:', viewType);
      calendarApi.changeView(viewType);
      setCurrentTitle(calendarApi.view.title);
    }
    onViewChange?.(newView);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (onEventClick) {
      const workSession = clickInfo.event.extendedProps.workSession as WorkSession;
      onEventClick(workSession);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.allDay);
    }
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    if (onEventDrop) {
      onEventDrop(
        dropInfo.event.id,
        dropInfo.event.start!,
        dropInfo.event.end!
      );
    }
  };

  const calendarEvents: EventInput[] = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.backgroundColor,
    borderColor: event.borderColor,
    textColor: event.textColor,
    extendedProps: event.extendedProps,
  }));

  return (
    <Card className="w-full border border-gray-200 shadow-sm bg-white">
      <CardHeader className="space-y-4 pb-4 border-b border-gray-200 bg-white">
        {/* Title and View Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#35b8cf] text-white">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Lịch làm việc
              </h2>
              <p className="text-sm text-gray-600">Quản lý ca làm việc hiệu quả</p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
            <Button
              variant={currentView === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('month')}
              className={
                currentView === 'month' 
                  ? 'bg-[#35b8cf] text-white hover:bg-[#2a9bb5] font-medium' 
                  : 'text-gray-700 hover:bg-white font-medium'
              }
            >
              Tháng
            </Button>
            <Button
              variant={currentView === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('week')}
              className={
                currentView === 'week' 
                  ? 'bg-[#35b8cf] text-white hover:bg-[#2a9bb5] font-medium' 
                  : 'text-gray-700 hover:bg-white font-medium'
              }
            >
              Tuần
            </Button>
            <Button
              variant={currentView === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('day')}
              className={
                currentView === 'day' 
                  ? 'bg-[#35b8cf] text-white hover:bg-[#2a9bb5] font-medium' 
                  : 'text-gray-700 hover:bg-white font-medium'
              }
            >
              Ngày
            </Button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrev}
              className="border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="border-gray-300 hover:bg-gray-50 text-gray-700 font-medium ml-2"
            >
              Hôm nay
            </Button>
          </div>
          
          <div className="text-lg font-semibold text-gray-900">
            {currentTitle}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2.5">
        {loading ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-[#35b8cf] absolute top-0 left-1/2 transform -translate-x-1/2"></div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-700 font-medium">Đang tải lịch làm việc...</p>
                <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={getViewType(view)}
              events={calendarEvents}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              eventClick={handleEventClick}
              select={handleDateSelect}
              eventDrop={handleEventDrop}
              height={height}
              locale="vi"
              headerToolbar={false}
              buttonText={{
                today: 'Hôm nay',
                month: 'Tháng',
                week: 'Tuần',
                day: 'Ngày',
                list: 'Danh sách'
              }}
              allDayText="Cả ngày"
              noEventsText="Không có lịch làm việc"
              timeZone="Asia/Ho_Chi_Minh"
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              eventContent={(eventInfo) => {
                const getStatusColor = (status: string) => {
                  switch (status?.toLowerCase()) {
                    case 'approved':
                    case 'đã duyệt':
                      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    case 'pending':
                    case 'chờ duyệt':
                      return 'bg-amber-50 text-amber-700 border-amber-200';
                    case 'rejected':
                    case 'từ chối':
                      return 'bg-red-50 text-red-700 border-red-200';
                    default:
                      return 'bg-gray-50 text-gray-700 border-gray-200';
                  }
                };

                const currentViewType = eventInfo.view.type;
                const isMonthView = currentViewType.includes('dayGrid');
                const isWeekView = currentViewType.includes('timeGridWeek');
                const isDayView = currentViewType.includes('timeGridDay');
                const workSession = eventInfo.event.extendedProps.workSession;

                return (
                  <div className="h-full p-2 bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md hover:border-[#35b8cf]/30 transition-all duration-200 group">
                    <div className="flex flex-col h-full">
                      {/* Title */}
                      <div className={`font-medium text-gray-900 group-hover:text-[#35b8cf] transition-colors ${isMonthView ? 'text-xs truncate' : 'text-sm'} ${!isMonthView ? 'leading-tight' : ''}`}>
                        {eventInfo.event.title || 'Ca làm việc'}
                      </div>
                      
                      {/* Time - Show in all views */}
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">
                          {eventInfo.event.start?.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {eventInfo.event.end && (
                            ` - ${eventInfo.event.end.toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}`
                          )}
                        </span>
                      </div>

                      {/* Services - Show in week and day view */}
                      {(isWeekView || isDayView) && workSession?.services && workSession.services.length > 0 && (
                        <div className="mt-1">
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">{workSession.services.length} dịch vụ:</span>
                            <div className="mt-1">
                              {workSession.services.slice(0, isDayView ? 3 : 1).map((service: {service?: {name?: string}}, index: number) => (
                                <div key={index} className="text-xs text-gray-500 truncate">
                                  • {service.service?.name || `Dịch vụ ${index + 1}`}
                                </div>
                              ))}
                              {workSession.services.length > (isDayView ? 3 : 1) && (
                                <div className="text-xs text-gray-400">
                                  +{workSession.services.length - (isDayView ? 3 : 1)} khác
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Location - Show in day view only */}
                      {isDayView && workSession?.booth?.name && (
                        <div className="mt-1">
                          <div className="text-xs text-gray-500">
                            📍 {workSession.booth.name}
                          </div>
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="mt-auto pt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(eventInfo.event.extendedProps.status)}`}
                        >
                          {eventInfo.event.extendedProps.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              }}
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              eventClassNames={(arg) => [
                'cursor-pointer',
                'transition-all',
                'hover:shadow-lg',
                'hover:scale-105',
                'rounded-md',
                'border',
                'overflow-hidden'
              ]}
              datesSet={(dateInfo) => {
                setCurrentTitle(dateInfo.view.title);
              }}
            />
          </div>
        )}
      </CardContent>

      <style jsx global>{`
        .calendar-container {
          background: #ffffff;
          border-radius: 12px;
          padding: 4px;
          border: 1px solid #e5e7eb;
        }
        
        .fc-theme-standard .fc-event {
          border-radius: 6px;
          border: none;
          padding: 0;
          background: transparent !important;
          overflow: hidden;
          margin: 1px;
          min-height: 24px;
        }
        
        .fc-theme-standard .fc-event:hover {
          transform: translateY(-1px);
          z-index: 10;
        }
        
        .fc-theme-standard .fc-event-title {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .fc-theme-standard .fc-event-time {
          font-weight: 400;
          font-size: 0.75rem;
        }
        
        .fc-button-primary {
          background: #35b8cf;
          border: 1px solid #35b8cf;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .fc-button-primary:hover {
          background: #2a9bb5;
          border-color: #2a9bb5;
        }
        
        .fc-today-button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          border-radius: 6px;
          font-weight: 500;
        }
        
        .fc-today-button:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }
        
        .fc-daygrid-day-top {
          text-align: center;
          padding: 8px;
        }
        
        .fc-col-header-cell {
          background: #f9fafb;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          color: #374151;
          border: 1px solid #e5e7eb;
          padding: 12px 8px;
        }
        
        .fc-timegrid-slot-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
          padding: 4px 8px;
        }
        
        .fc-scrollgrid {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        
        .fc-daygrid-day.fc-day-today {
          background: #f0f9ff;
          position: relative;
        }
        
        .fc-daygrid-day.fc-day-today::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #35b8cf;
          z-index: 1;
        }
        
        .fc-timegrid-col.fc-day-today {
          background: #f0f9ff;
        }
        
        .fc-day-past {
          background-color: #fafafa;
        }
        
        .fc-day-future {
          background-color: #ffffff;
        }
        
        .fc-h-event {
          border-radius: 4px;
          margin: 1px 0;
        }
        
        .fc-v-event {
          border-radius: 4px;
          margin: 0 1px;
        }
        
        .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }
        
        .fc-toolbar-chunk {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .fc-direction-ltr .fc-toolbar > * > :not(:first-child) {
          margin-left: 8px;
        }
      `}</style>
    </Card>
  );
}
