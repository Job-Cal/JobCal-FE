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
      <span className="min-w-0 flex-1 truncate font-semibold">{posting.company_name}</span>
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
