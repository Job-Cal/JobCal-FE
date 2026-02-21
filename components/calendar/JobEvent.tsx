'use client';

import { Application } from '@/types/application';
import { ApplicationStatusStyles } from '@/types/application';

interface JobEventProps {
  application?: Application; // 커스텀 캘린더용
  event?: { resource?: Application }; // react-big-calendar 호환용 (기존 구조)
}

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
    const parsed = new Date(posting.deadline);
    if (isNaN(parsed.getTime())) return null;
    const deadlineEnd = new Date(parsed);
    deadlineEnd.setHours(23, 59, 59, 999);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return Math.ceil((deadlineEnd.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  })();
  const dDayLabel = dayDiff === null ? null : dayDiff <= 0 ? 'D-day' : `D-${dayDiff}`;
  const dDayToneClass = dayDiff !== null && dayDiff <= 3
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : 'border-[#d9e3ef] bg-[#f6f9fd] text-[#4c627e]';
  
  return (
    <div
      title={tooltip}
      className="group flex w-full items-center gap-1 rounded-md border px-[5px] py-[3px] text-[10px] leading-tight transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(44,84,128,0.12)]"
      style={{
        backgroundColor: '#ffffff',
        color: '#1f2d40',
        borderColor: styleSet?.border,
      }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: styleSet?.accent }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate font-semibold">{posting.company_name}</span>
      {dDayLabel && (
        <span className={`shrink-0 rounded border px-1 py-[1px] text-[9px] font-bold ${dDayToneClass}`}>
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
