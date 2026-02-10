'use client';

import { Application } from '@/types/application';
import { ApplicationStatusLabels, ApplicationStatusStyles } from '@/types/application';

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
  const deadline =
    posting.deadline &&
    new Date(posting.deadline).toLocaleDateString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
    });
  const location = posting.location;
  const title = posting.job_title;
  const statusLabel = ApplicationStatusLabels[app.status];
  const styleSet = ApplicationStatusStyles[app.status];
  
  return (
    // 한 셀 안에 여러 이벤트가 들어갈 수 있도록 매우 컴팩트한 레이아웃으로 구성
    <div
      className="flex w-full flex-col rounded-md border px-[4px] py-[3px] text-[10px] leading-snug shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
      style={{
        backgroundColor: styleSet?.bg,
        color: styleSet?.text,
        borderColor: styleSet?.border,
      }}
    >
      <div
        className="mb-[3px] h-[3px] w-full rounded-full"
        style={{ backgroundColor: styleSet?.accent }}
      />
      {/* 회사명 + 직무 (한 줄 안에서 최대한 압축) */}
      <div className="truncate font-semibold">
        {posting.company_name}
        {title && ` · ${title}`}
      </div>

      {/* 지역 / 마감일 / 상태를 한 줄로 요약 */}
      <div className="mt-[2px] flex items-center gap-1">
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
        <span className="ml-auto shrink-0 font-semibold">
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
