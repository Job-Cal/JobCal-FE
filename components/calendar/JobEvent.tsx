'use client';

import { Application } from '@/types/application';
import { ApplicationStatusLabels } from '@/types/application';
import { Event } from 'react-big-calendar';

interface JobEventProps {
  event: Event;
}

export default function JobEvent({ event }: JobEventProps) {
  const app = (event as any).resource as Application | undefined;
  
  if (!app) {
    return <div className="text-xs p-1">{event.title}</div>;
  }

  const posting = app.job_posting;
  const deadline =
    posting.deadline &&
    new Date(posting.deadline).toLocaleDateString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
    });
  const location = posting.location;
  const title = posting.job_title;
  const statusLabel = ApplicationStatusLabels[app.status];
  
  return (
    // 한 셀 안에 여러 이벤트가 들어갈 수 있도록 매우 컴팩트한 레이아웃으로 구성
    <div className="flex w-full flex-col p-[2px] text-[9px] leading-snug">
      {/* 회사명 + 직무 (한 줄 안에서 최대한 압축) */}
      <div className="truncate font-semibold">
        {posting.company_name}
        {title && ` · ${title}`}
      </div>

      {/* 지역 / 마감일 / 상태를 한 줄로 요약 */}
      <div className="mt-[1px] flex items-center gap-1 opacity-90">
        {location && (
          <span className="max-w-[45%] truncate">
            {location}
          </span>
        )}
        {deadline && (
          <span className="shrink-0">
            {deadline}
          </span>
        )}
        <span className="ml-auto shrink-0">
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
