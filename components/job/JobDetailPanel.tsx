'use client';

import { Application, ApplicationStatus, ApplicationStatusLabels, ApplicationStatusStyles } from '@/types/application';
import { applicationsApi } from '@/lib/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ExternalLink, Calendar, Building2, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface JobDetailPanelProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
  readOnly?: boolean;
}

const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const dateOnly = value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const toMonthStart = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
const toDateValue = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const fromDateInputValue = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toKoreanDateLabel = (value: string): string => {
  const parsed = fromDateInputValue(value);
  if (!parsed) return '날짜 선택';
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

const getSourceSiteLabel = (url: string): string => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('wanted.co.kr')) return '원티드';
    if (host.includes('inthiswork.com')) return '인디스워크';
    if (host.includes('jobkorea.co.kr')) return '잡코리아';
    if (host.includes('saramin.co.kr')) return '사람인';
    return host;
  } catch {
    return '알 수 없음';
  }
};

const getSourceDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '-';
  }
};

export default function JobDetailPanel({
  application,
  isOpen,
  onClose,
  onUpdate,
  onNotify,
  readOnly = false,
}: JobDetailPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(ApplicationStatus.NOT_APPLIED);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState('');
  const [isDeadlineSaving, setIsDeadlineSaving] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(toMonthStart(new Date()));
  const [showRawDescription, setShowRawDescription] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  const appId = application?.id ?? null;
  const appStatus = application?.status ?? null;
  const appDeadline = application?.job_posting?.deadline ?? null;

  useEffect(() => {
    if (!application) return;
    setCurrentStatus(application.status);
    const normalized = toDateInputValue(application.job_posting.deadline);
    setDeadlineInput(normalized);
    setShowRawDescription(false);
    const selectedDate = fromDateInputValue(normalized);
    setViewMonth(toMonthStart(selectedDate ?? new Date()));
  }, [appId, appStatus, appDeadline]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!panelRef.current) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusedElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const handleStatusChange = async (status: ApplicationStatus) => {
    if (!application || readOnly) return;
    const previousStatus = currentStatus;
    setIsUpdating(true);
    setCurrentStatus(status);
    try {
      console.log('Status change requested:', status);
      const updated = await applicationsApi.update(application.id, { status });
      console.log('Status change applied:', updated.status);
      setCurrentStatus(updated.status);
      setIsStatusOpen(false);
      onUpdate();
      onNotify?.('success', `지원 상태를 "${ApplicationStatusLabels[updated.status]}"로 변경했습니다.`);
    } catch (error) {
      console.error('Failed to update status:', error);
      setCurrentStatus(previousStatus);
      onNotify?.('error', '지원 상태 변경에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const originalDeadline = toDateInputValue(appDeadline);
  const handleDeadlineChange = async (nextDeadline: string) => {
    if (!application || readOnly) return;
    setDeadlineInput(nextDeadline);
    if (!nextDeadline || nextDeadline === originalDeadline || isDeadlineSaving) return;

    setIsDeadlineSaving(true);
    try {
      const updated = await applicationsApi.update(application.id, { deadline: nextDeadline });
      setDeadlineInput(toDateInputValue(updated.job_posting.deadline));
      onUpdate();
      onNotify?.('success', '마감일을 수정했습니다.');
    } catch (error) {
      console.error('Failed to update deadline:', error);
      setDeadlineInput(originalDeadline);
      onNotify?.('error', '마감일 수정에 실패했습니다.');
    } finally {
      setIsDeadlineSaving(false);
    }
  };

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const startWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
    const today = toDateValue(new Date());
    const selected = deadlineInput;

    return Array.from({ length: totalCells }, (_, index) => {
      const offset = index - startWeekday + 1;
      let date: Date;
      let inCurrentMonth = true;

      if (offset < 1) {
        date = new Date(year, month - 1, prevMonthDays + offset);
        inCurrentMonth = false;
      } else if (offset > daysInMonth) {
        date = new Date(year, month + 1, offset - daysInMonth);
        inCurrentMonth = false;
      } else {
        date = new Date(year, month, offset);
      }

      const value = toDateValue(date);

      return {
        value,
        day: date.getDate(),
        inCurrentMonth,
        isToday: value === today,
        isSelected: value === selected,
      };
    });
  }, [viewMonth, deadlineInput]);

  if (!isOpen || !application) return null;
  const sourceSiteLabel = getSourceSiteLabel(application.job_posting.original_url);
  const sourceDomain = getSourceDomain(application.job_posting.original_url);
  const hasRawDescription = !!application.job_posting.description_raw;
  const renderedDescription = showRawDescription && hasRawDescription
    ? application.job_posting.description_raw
    : application.job_posting.description;

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px]"
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="채용 상세 모달"
        onClick={(event) => event.stopPropagation()}
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[#cfd8e3] bg-white/95 shadow-[0_28px_70px_rgba(15,23,42,0.24)] sm:max-h-[90vh] sm:w-[calc(100vw-2rem)] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-[#0e5a99] bg-[#136fbd] p-4 sm:p-6">
          <h2 className="text-xl font-extrabold text-white">채용 상세</h2>
          <button
            data-autofocus
            onClick={onClose}
            className="text-white/80 transition-colors hover:text-white"
            aria-label="닫기"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#eef4fb] p-4 sm:p-6">
          <div className="rounded-2xl border-2 border-[#c9d9ea] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-slate-500" />
                <h3 className="text-lg font-bold text-slate-900">{application.job_posting.company_name}</h3>
              </div>
              <span
                className="rounded-full px-2 py-1 text-[11px] font-bold"
                style={{
                  backgroundColor: ApplicationStatusStyles[currentStatus].bg,
                  color: ApplicationStatusStyles[currentStatus].text,
                  border: `1px solid ${ApplicationStatusStyles[currentStatus].border}`,
                }}
              >
                {ApplicationStatusLabels[currentStatus]}
              </span>
            </div>
            <p className="text-[15px] text-slate-700">{application.job_posting.job_title}</p>
          </div>

          <div className="rounded-2xl border-2 border-[#c9d9ea] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
            <div className="mb-2">
              <label className="text-sm font-bold text-[#2e435a]">마감일</label>
              <div className="mt-1 h-px w-full bg-[#d2deec]" aria-hidden="true" />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (readOnly) return;
                  setIsDatePickerOpen((prev) => !prev);
                }}
                className={`flex w-full items-center justify-between rounded-2xl border border-[#cfd8e3] bg-white px-3 py-2.5 text-left text-sm text-slate-700 transition-colors ${
                  readOnly ? 'cursor-not-allowed opacity-80' : 'hover:border-[#9dcff9]'
                }`}
                disabled={readOnly}
              >
                <span className="inline-flex items-center gap-2">
                  <Calendar size={16} className="text-slate-500" />
                  <span>{toKoreanDateLabel(deadlineInput)}</span>
                </span>
                <span className="text-xs font-semibold text-slate-500">{isDatePickerOpen ? '닫기' : '선택'}</span>
              </button>

              {!readOnly && isDatePickerOpen && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full rounded-2xl border border-[#dbe6f2] bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      className="rounded-lg border border-[#dbe6f2] p-1.5 text-slate-600 hover:bg-[#f3f8fd]"
                      aria-label="이전 달"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="text-sm font-bold text-[#132033]">
                      {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      className="rounded-lg border border-[#dbe6f2] p-1.5 text-slate-600 hover:bg-[#f3f8fd]"
                      aria-label="다음 달"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-500">
                    {WEEKDAY_LABELS.map((weekday) => (
                      <span key={weekday} className="py-1">
                        {weekday}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        disabled={isDeadlineSaving}
                        onClick={() => {
                          void handleDeadlineChange(day.value);
                          setViewMonth(toMonthStart(new Date(`${day.value}T12:00:00`)));
                          setIsDatePickerOpen(false);
                        }}
                        className={`rounded-lg py-1.5 text-center text-xs font-semibold transition-colors ${
                          day.isSelected
                            ? 'bg-[#136fbd] text-white'
                            : day.inCurrentMonth
                              ? 'text-slate-700 hover:bg-[#eef5fc]'
                              : 'text-slate-300 hover:bg-slate-50'
                        } ${day.isToday && !day.isSelected ? 'ring-1 ring-[#9dcff9]' : ''}`}
                      >
                        {day.day}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl border border-[#dbe6f2] bg-[#f7fbff] py-2 text-xs font-semibold text-[#35516f] hover:bg-[#edf4fb]"
                    onClick={() => setIsDatePickerOpen(false)}
                  >
                    닫기
                  </button>
                </div>
              )}
              {isDeadlineSaving && (
                <p className="mt-2 text-xs text-[#58677c]">마감일 저장 중...</p>
              )}
              {readOnly && (
                <p className="mt-2 text-xs text-[#58677c]">로그인 후 마감일을 수정할 수 있습니다.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#c9d9ea] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
            <div className="mb-2">
              <label className="text-sm font-bold text-[#2e435a]">지원 상태</label>
              <div className="mt-1 h-px w-full bg-[#d2deec]" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (readOnly) return;
                  setIsStatusOpen((prev) => !prev);
                }}
                className={`flex w-full items-center justify-between rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2 text-slate-800 transition-colors ${
                  readOnly ? 'cursor-not-allowed opacity-80' : 'hover:border-[#9dcff9]'
                }`}
                disabled={readOnly}
              >
                <span className="inline-flex items-center gap-2 font-semibold">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: ApplicationStatusStyles[currentStatus].accent }}
                    aria-hidden="true"
                  />
                  {ApplicationStatusLabels[currentStatus]}
                </span>
                <span className="text-xs">{readOnly ? '' : isStatusOpen ? '닫기' : '변경'}</span>
              </button>

              {!readOnly && isStatusOpen && (
                <div className="space-y-2">
                  {Object.values(ApplicationStatus).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={isUpdating}
                      className="w-full rounded-2xl border px-4 py-2 text-left transition-colors"
                      style={
                        currentStatus === status
                          ? {
                              backgroundColor: '#ffffff',
                              borderColor: ApplicationStatusStyles[status].accent,
                              color: ApplicationStatusStyles[status].text,
                            }
                          : {
                              backgroundColor: '#ffffff',
                              borderColor: '#e2e8f0',
                              color: '#0f172a',
                            }
                      }
                    >
                      {ApplicationStatusLabels[status]}
                    </button>
                  ))}
                </div>
              )}
              {readOnly && (
                <p className="text-xs text-[#58677c]">로그인 후 지원 상태를 변경할 수 있습니다.</p>
              )}
            </div>
          </div>

          {application.job_posting.location && (
            <div className="rounded-2xl border-2 border-[#c9d9ea] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
              <div className="mb-1">
                <label className="text-sm font-bold text-[#2e435a]">근무지역</label>
                <div className="mt-1 h-px w-full bg-[#d2deec]" aria-hidden="true" />
              </div>
              <p className="text-slate-700">{application.job_posting.location}</p>
            </div>
          )}

          {renderedDescription && (
            <div className="rounded-2xl border-2 border-[#c9d9ea] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-sm font-bold text-[#2e435a]">설명</label>
                {hasRawDescription && (
                  <button
                    type="button"
                    onClick={() => setShowRawDescription((prev) => !prev)}
                    className="rounded-lg border border-[#c9d9ea] bg-[#f7fbff] px-2 py-1 text-xs font-semibold text-[#3c5d7d] hover:bg-[#edf4fb]"
                  >
                    {showRawDescription ? '정리본 보기' : '원문 보기'}
                  </button>
                )}
              </div>
              <div className="mb-2 h-px w-full bg-[#d2deec]" aria-hidden="true" />
              <div className="text-sm leading-6 text-slate-700">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 whitespace-pre-wrap last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
                  }}
                >
                  {renderedDescription}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {application.memo && (
            <div className="rounded-2xl border-2 border-[#c9d9ea] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
              <div className="mb-1">
                <label className="text-sm font-bold text-[#2e435a]">메모</label>
                <div className="mt-1 h-px w-full bg-[#d2deec]" aria-hidden="true" />
              </div>
              <p className="text-sm leading-6 text-slate-700">{application.memo}</p>
            </div>
          )}

          <div className="rounded-2xl border-2 border-[#c9d9ea] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#d3e2f2] bg-[#f7fbff] px-3 py-1.5">
                <Globe size={13} className="text-[#5b7593]" />
                <span className="rounded-md bg-[#136fbd] px-2 py-0.5 text-[11px] font-bold text-white">
                  {sourceSiteLabel}
                </span>
                <span className="text-xs font-semibold text-[#5a6e86]">{sourceDomain}</span>
              </div>
            <a
              href={application.job_posting.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#c8daee] bg-white px-3 py-2 text-sm font-semibold text-[#1f476f] shadow-[0_4px_12px_rgba(19,111,189,0.12)] transition-colors hover:bg-[#edf4fb]"
            >
              <ExternalLink size={16} />
              원본 공고 보기
            </a>
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="border-t border-[#dbe6f2] bg-[#f2f7fd] p-4 sm:p-6">
            <button
              onClick={async () => {
                if (confirm('정말 삭제하시겠습니까?')) {
                  try {
                    await applicationsApi.delete(application.id);
                    onUpdate();
                    onClose();
                    onNotify?.('success', '공고를 삭제했습니다.');
                  } catch (error) {
                    console.error('Failed to delete:', error);
                    onNotify?.('error', '공고 삭제에 실패했습니다.');
                  }
                }
              }}
              className="w-full rounded-2xl bg-rose-600 px-4 py-2 text-white transition-colors hover:bg-rose-700"
            >
              삭제하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
