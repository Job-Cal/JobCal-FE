'use client';

import { Calendar, momentLocalizer, View, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Application } from '@/types/application';
import { ApplicationStatusStyles } from '@/types/application';
import { useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import JobEvent from './JobEvent';

// Extend Event type to include our custom properties
interface JobEvent extends Event {
  id?: number;
  resource?: Application;
  allDay?: boolean;
  style?: {
    backgroundColor?: string;
    color?: string;
    border?: string;
  };
}

const localizer = momentLocalizer(moment);

interface JobCalendarProps {
  applications: Application[];
  onSelectEvent?: (application: Application) => void;
}

export default function JobCalendar({ applications, onSelectEvent }: JobCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Convert applications to calendar events
  const events = applications
    .map((app): JobEvent | null => {
      // Only process applications with valid deadlines
      if (!app.job_posting.deadline) {
        return null;
      }

      // Parse deadline - handle both date strings and datetime strings
      let deadline: Date;
      const deadlineStr = app.job_posting.deadline;
      
      try {
        if (typeof deadlineStr === 'string') {
          // Handle different date formats
          if (deadlineStr.length === 10) {
            // YYYY-MM-DD format
            deadline = new Date(deadlineStr + 'T12:00:00');
          } else if (deadlineStr.includes('T')) {
            // ISO datetime format
            deadline = new Date(deadlineStr);
          } else {
            // Try parsing as-is
            deadline = new Date(deadlineStr);
          }
        } else {
          deadline = new Date(deadlineStr);
        }
        
        // Check if date is valid
        if (isNaN(deadline.getTime())) {
          return null;
        }
        
        // For month view, set to start of day
        deadline.setHours(0, 0, 0, 0);
        
        // For all-day events in react-big-calendar month view:
        // allDay: true일 때, end는 start와 정확히 같은 Date 객체여야 함
        // 같은 날짜의 다른 Date 객체를 만들면 react-big-calendar가 여러 날에 걸쳐 표시할 수 있음
        // 따라서 start와 end를 같은 Date 객체로 설정

        const event: JobEvent = {
          title: app.job_posting.company_name, // 회사 이름만 표시
          start: deadline,
          end: deadline, // Use the same Date object for single-day all-day events
          allDay: true, // Mark as all-day event for month view
          resource: app,
          id: app.id,
        };
        
        return event;
      } catch (error) {
        return null;
      }
    })
    .filter((event): event is JobEvent => event !== null); // Remove null events

  const eventStyleGetter = (event: JobEvent) => {
    const app = event.resource as Application;
    if (!app || !event.start) {
      return { style: {} };
    }
    
    const style: React.CSSProperties = {
      backgroundColor: 'transparent',
      color: '#111827',
      border: 'none',
      borderRadius: 0,
      padding: 0,
      display: 'block',
      opacity: 1,
      visibility: 'visible' as const,
      overflow: 'visible',
    };
    
    return { style };
  };

  const handleSelectEvent = (event: JobEvent) => {
    if (onSelectEvent && event.resource) {
      onSelectEvent(event.resource as Application);
    }
  };


  const Toolbar = ({ label, onNavigate }: { label: string; onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void }) => (
    <div className="rbc-toolbar">
      <span className="rbc-toolbar-label">{label}</span>
      <span className="rbc-btn-group flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate('PREV')}
          aria-label="이전"
          title="이전"
          className="flex h-9 w-9 items-center justify-center"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => onNavigate('TODAY')}
          aria-label="오늘"
          title="오늘"
          className="flex h-9 w-9 items-center justify-center"
        >
          <CalendarCheck size={18} />
        </button>
        <button
          type="button"
          onClick={() => onNavigate('NEXT')}
          aria-label="다음"
          title="다음"
          className="flex h-9 w-9 items-center justify-center"
        >
          <ChevronRight size={18} />
        </button>
      </span>
    </div>
  );

  return (
    <div className="w-full" style={{ minHeight: 600 }}>
      {events.length === 0 && (
        <div className="p-4 text-center text-slate-500 mb-4">
          마감일이 있는 공고가 없습니다. 공고를 추가하고 마감일을 입력해주세요.
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        components={{
          event: JobEvent,
          toolbar: Toolbar,
        }}
        showAllEvents
        popup={false}
        views={['month']}
        className="job-calendar"
        style={{ height: 'auto', minHeight: 600 }}
        messages={{
          next: '다음',
          previous: '이전',
          today: '오늘',
          month: '월',
          noEventsInRange: '이 기간에 일정이 없습니다.',
        }}
      />
    </div>
  );
}
