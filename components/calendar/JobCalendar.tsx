'use client';

import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Application } from '@/types/application';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const HOLIDAY_LABELS: Record<string, string> = {
  '2026-01-01': '신정',
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절',
  '2026-05-05': '어린이날',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-10-03': '개천절',
  '2026-10-09': '한글날',
  '2026-12-25': '성탄절',
};

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface JobCalendarProps {
  applications: Application[];
  onSelectEvent?: (application: Application) => void;
  onSelectDate?: (date: Date) => void;
  disableInteraction?: boolean;
}

export default function JobCalendar({
  applications,
  onSelectEvent,
  onSelectDate,
  disableInteraction = false,
}: JobCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const formattedMonthLabel = moment(currentDate).format('YYYY.MM');
  const canSelectDate = !!onSelectDate;

  const getDayMeta = (date: Date) => {
    const day = date.getDay();
    const dateKey = toDateKey(date);
    return {
      isSunday: day === 0,
      isSaturday: day === 6,
      isHoliday: !!HOLIDAY_LABELS[dateKey],
    };
  };

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
    if (disableInteraction) return;
    if (onSelectEvent && event.resource) {
      onSelectEvent(event.resource as Application);
    }
  };


  const Toolbar = ({ onNavigate }: { label: string; onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void }) => (
    <div className="rbc-toolbar -mt-1 mb-2 sm:-mt-6 sm:mb-5 md:-mt-10">
      <div className="inline-flex w-full items-center justify-center">
      <button
        type="button"
        onClick={() => onNavigate('PREV')}
        aria-label="이전"
        title="이전"
        className="!border-0 !bg-transparent !p-0 !rounded-none text-[#4c627e] transition-colors hover:text-[#2b4f78] hover:!bg-transparent"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="mx-[14px] px-0 text-center text-[18px] font-black leading-none tracking-tight text-[#132033] sm:text-[20px]">
        {formattedMonthLabel}
      </span>
      <button
        type="button"
        onClick={() => onNavigate('NEXT')}
        aria-label="다음"
        title="다음"
        className="!border-0 !bg-transparent !p-0 !rounded-none text-[#4c627e] transition-colors hover:text-[#2b4f78] hover:!bg-transparent"
      >
        <ChevronRight size={18} />
      </button>
      </div>
    </div>
  );

  const DateHeader = ({ date, label }: { date: Date; label: string }) => {
    const meta = getDayMeta(date);
    return (
      <div className="rbc-custom-date-header">
        <span
          className={`rbc-custom-date-number ${
            meta.isHoliday || meta.isSunday
              ? 'rbc-date-red'
              : meta.isSaturday
                ? 'rbc-date-blue'
                : ''
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  const DateCellWrapper = ({ value, children }: { value?: Date; children?: React.ReactNode }) => (
    <div
      className="h-full w-full"
      onClick={(event) => {
        if (!canSelectDate || !value) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest('.rbc-event')) return;
        onSelectDate?.(value);
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="w-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectEvent={handleSelectEvent}
        selectable={canSelectDate ? 'ignoreEvents' : false}
        longPressThreshold={1}
        onSelectSlot={canSelectDate ? (slotInfo: { start: Date }) => onSelectDate?.(slotInfo.start) : undefined}
        onDrillDown={canSelectDate ? (date) => onSelectDate?.(date) : undefined}
        dayPropGetter={(date: Date) => {
          const meta = getDayMeta(date);
          const classNames = [
            meta.isSunday ? 'rbc-day-sunday' : '',
            meta.isSaturday ? 'rbc-day-saturday' : '',
            meta.isHoliday ? 'rbc-day-holiday' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return { className: classNames };
        }}
        eventPropGetter={eventStyleGetter}
        components={{
          event: JobEvent,
          toolbar: Toolbar,
          dateCellWrapper: DateCellWrapper,
          month: {
            dateHeader: DateHeader,
          },
        }}
        showAllEvents
        popup={false}
        views={['month']}
        className="job-calendar"
        style={{ height: 'auto', minHeight: 0 }}
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
