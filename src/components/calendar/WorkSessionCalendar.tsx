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
    <Card className="w-full border shadow-sm bg-white">
      <CardHeader className="space-y-4 pb-4 border-b">
        {/* Title and View Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#35b8cf] text-white">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lịch làm việc</h2>
              <p className="text-sm text-gray-600">Xem và quản lý ca làm việc</p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <Button
              variant={currentView === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('month')}
              className={currentView === 'month' ? 'bg-[#35b8cf] text-white hover:bg-[#2a9bb5]' : 'hover:bg-gray-100'}
            >
              Tháng
            </Button>
            <Button
              variant={currentView === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('week')}
              className={currentView === 'week' ? 'bg-[#35b8cf] text-white hover:bg-[#2a9bb5]' : 'hover:bg-gray-100'}
            >
              Tuần
            </Button>
            <Button
              variant={currentView === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('day')}
              className={currentView === 'day' ? 'bg-[#35b8cf] text-white hover:bg-[#2a9bb5]' : 'hover:bg-gray-100'}
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
              className="hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="hover:bg-gray-50"
            >
              Hôm nay
            </Button>
          </div>
          
          <div className="text-lg font-semibold text-gray-900">
            {currentTitle}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
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
              eventContent={(eventInfo) => (
                <div className="p-1 text-xs">
                  <div className="font-medium truncate">
                    {eventInfo.event.title}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
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
                  <div className="mt-1">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {eventInfo.event.extendedProps.status}
                    </Badge>
                  </div>
                </div>
              )}
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
          border-radius: 8px;
          padding: 0;
        }
        
        .fc-theme-standard .fc-event {
          border-radius: 6px;
          border: none;
          padding: 4px 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .fc-theme-standard .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
          color: #6b7280;
          border: 1px solid #e5e7eb;
          padding: 12px 8px;
        }
        
        .fc-timegrid-slot-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .fc-scrollgrid {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        
        .fc-daygrid-day.fc-day-today {
          background: #f0f9ff;
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
