'use client';

import { Application } from '@/types/application';
import { ApplicationStatusStyles } from '@/types/application';

interface JobEventProps {
  application?: Application; // 커스텀 캘린더용
  event?: { resource?: Application }; // react-big-calendar 호환용 (기존 구조)
}

const parseDeadlineDate = (value: string): Date | null => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function JobEvent({ application, event }: JobEventProps) {
  // application prop 우선 사용, 없으면 event.resource에서 가져오기
  const app = application ?? (event?.resource as Application | undefined);

  if (!app || !app.job_posting) {
    return null;
  }

  const posting = app.job_posting;
  const location = posting.location;
  const title = posting.job_title;
  const styleSet = ApplicationStatusStyles[app.status];
  const tooltip = [posting.company_name, title, location].filter(Boolean).join(' · ');
  const dayDiff = (() => {
    if (!posting.deadline) return null;
    const parsed = parseDeadlineDate(posting.deadline);
    if (!parsed) return null;
    const deadlineStart = new Date(parsed);
    deadlineStart.setHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return Math.floor((deadlineStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  })();
  const dDayLabel = dayDiff === null
    ? null
    : dayDiff < 0
      ? '마감'
      : dayDiff === 0
        ? 'D-day'
        : `D-${dayDiff}`;
  const dDayToneClass = dayDiff !== null && dayDiff < 0
    ? 'border-slate-200 bg-slate-100 text-slate-600'
    : dayDiff !== null && dayDiff <= 3
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-[#d9e3ef] bg-[#f6f9fd] text-[#4c627e]';
  
  return (
    <div
      title={tooltip}
      className="job-event group flex w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] leading-tight transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(44,84,128,0.12)] sm:px-[5px] sm:py-[3px] sm:text-[10px]"
      style={{
        backgroundColor: '#ffffff',
        color: '#1f2d40',
        borderColor: styleSet?.border,
      }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full sm:h-2 sm:w-2"
        style={{ backgroundColor: styleSet?.accent }}
        aria-hidden="true"
      />
      <span className="hidden min-w-0 flex-1 truncate font-semibold sm:block">{posting.company_name}</span>
      {dDayLabel && (
        <span className={`inline-flex shrink-0 rounded border px-1 py-[1px] text-[8px] font-bold sm:text-[9px] ${dDayToneClass}`}>
          {dDayLabel}
        </span>
      )}
      {title && (
        <span className="sr-only">
          {title}
        </span>
      )}
      {location && (
        <span className="sr-only">
          {location}
        </span>
      )}
    </div>
  );
}
