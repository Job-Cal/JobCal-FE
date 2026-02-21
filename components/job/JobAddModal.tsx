'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2, Info, Sparkles, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { JobPostingCreate } from '@/types/job';

interface JobAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: AddMode;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

interface FormData {
  url: string;
}

export type AddMode = 'parse' | 'manual';

const SUPPORTED_URL_ONLY_ERROR = '지원하지 않는 주소입니다. 원티드/인디스워크 URL만 지원합니다.';
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const toMonthStart = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
const toDateValue = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const fromDateInputValue = (value: string | null | undefined): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toKoreanDateLabel = (value: string | null | undefined): string => {
  const parsed = fromDateInputValue(value);
  if (!parsed) return '날짜 선택';
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

const isSupportedJobUrl = (value: string): boolean => {
  try {
    const { hostname } = new URL(value);
    const normalizedHost = hostname.toLowerCase();
    return normalizedHost === 'wanted.co.kr'
      || normalizedHost.endsWith('.wanted.co.kr')
      || normalizedHost === 'inthiswork.com'
      || normalizedHost.endsWith('.inthiswork.com');
  } catch {
    return false;
  }
};

export default function JobAddModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'parse',
  onNotify,
}: JobAddModalProps) {
  const [addMode, setAddMode] = useState<AddMode>('parse');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<JobPostingCreate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeadlineError, setShowDeadlineError] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(toMonthStart(new Date()));
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const createEmptyDraft = (): JobPostingCreate => ({
    company_name: '',
    job_title: '',
    deadline: null,
    original_url: '',
    description: null,
    description_raw: null,
    location: null,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setAddMode(initialMode);
    setShowDeadlineError(false);
    setIsDatePickerOpen(false);
    if (initialMode === 'manual') {
      setParsedData((prev) => prev ?? createEmptyDraft());
    } else {
      setParsedData(null);
      setParseError(null);
    }

    previousFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!modalRef.current) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const nodes = modalRef.current.querySelectorAll<HTMLElement>(
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
  }, [isOpen, onClose, initialMode]);

  if (!isOpen) return null;

  const handleParse = async (data: FormData) => {
    setIsParsing(true);
    setParseError(null);
    setParsedData(null);

    if (!isSupportedJobUrl(data.url)) {
      setParseError(SUPPORTED_URL_ONLY_ERROR);
      onNotify?.('error', SUPPORTED_URL_ONLY_ERROR);
      setIsParsing(false);
      return;
    }

    try {
      const result = await jobsApi.parse(data.url);
      
      if (result.success && result.data) {
        setParsedData(result.data);
      } else {
        const message = result.error || '파싱에 실패했습니다.';
        setParseError(message);
        onNotify?.('error', message);
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || '파싱 중 오류가 발생했습니다.';
      setParseError(message);
      onNotify?.('error', message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    const payload = parsedData ?? editingData;
    if (!payload.deadline) {
      setShowDeadlineError(true);
      return;
    }
    setShowDeadlineError(false);

    setIsSaving(true);
    try {
      // Debug: log data before sending
      console.log('📤 Sending job data:', payload);
      console.log('📅 Deadline:', payload.deadline, 'Type:', typeof payload.deadline);
      
      const result = await jobsApi.create(payload);
      console.log('✅ Job created successfully:', result);
      console.log('📅 Saved deadline:', result.deadline);
      
      reset();
      setParsedData(null);
      setParseError(null);
      onSuccess();
      onNotify?.('success', '채용 공고를 저장했습니다.');
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving job:', error);
      const message = error.response?.data?.detail || '저장 중 오류가 발생했습니다.';
      setParseError(message);
      onNotify?.('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const editingData = parsedData ?? createEmptyDraft();
  const selectedDate = editingData.deadline ?? '';
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const today = toDateValue(new Date());
  const calendarDays = Array.from({ length: totalCells }, (_, index) => {
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
      isSelected: value === selectedDate,
    };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[4px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="채용 공고 추가"
        onClick={(event) => event.stopPropagation()}
        className={`flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#cfd8e3] bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.25)] ${
          addMode === 'manual' ? 'h-[90vh] md:h-[85vh]' : 'max-h-[90vh]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#0e5a99] bg-[#136fbd] p-6">
          <h2 className="text-2xl font-extrabold text-white">채용 공고 추가</h2>
          <button
            onClick={onClose}
            className="text-white/80 transition-colors hover:text-white"
            aria-label="닫기"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#edf4fb] p-6">
          {addMode === 'parse' && !parsedData ? (
            <form onSubmit={handleSubmit(handleParse)} className="space-y-4">
              <div>
                <div className="mb-3 overflow-hidden rounded-2xl border border-[#d9e6f5] bg-gradient-to-r from-[#f7fbff] to-[#eff6ff]">
                  <div className="flex items-center gap-2 border-b border-[#e2ecf8] px-3 py-2 text-xs font-semibold text-[#3f5d7c]">
                    <Sparkles size={13} />
                    <span>URL 파싱 지원 사이트</span>
                  </div>
                  <div className="grid gap-2 p-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#d7e5f4] bg-white px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6d87a5]">
                        <Info size={12} />
                        Wanted
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-[#20456b]">wanted.co.kr</p>
                    </div>
                    <div className="rounded-xl border border-[#d7e5f4] bg-white px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6d87a5]">
                        <Info size={12} />
                        Inthiswork
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-[#20456b]">inthiswork.com</p>
                    </div>
                  </div>
                </div>
                <label htmlFor="url" className="block text-sm font-semibold text-slate-700 mb-2">
                  채용 공고 URL
                </label>
                <input
                  id="url"
                  type="url"
                  {...register('url', { required: 'URL을 입력해주세요.' })}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2 focus:border-[#136fbd] focus:outline-none focus:ring-2 focus:ring-[#9dcff9]"
                  placeholder="https://www.wanted.co.kr/wd/..."
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
                )}
              </div>

              {parseError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm text-rose-600">{parseError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isParsing}
                  data-autofocus
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#136fbd] px-4 py-2 text-white shadow-[0_10px_22px_rgba(19,111,189,0.25)] transition-colors hover:bg-[#0e5a99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      파싱 중...
                    </>
                  ) : (
                    '파싱하기'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-[#cfd8e3] px-4 py-2 hover:bg-[#f2f7fd]"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  회사명
                </label>
                <input
                  type="text"
                  value={editingData.company_name}
                  onChange={(e) => setParsedData({ ...editingData, company_name: e.target.value })}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  직무명
                </label>
                <input
                  type="text"
                  value={editingData.job_title}
                  onChange={(e) => setParsedData({ ...editingData, job_title: e.target.value })}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  마감일 *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      const current = fromDateInputValue(editingData.deadline);
                      setViewMonth(toMonthStart(current ?? new Date()));
                      setIsDatePickerOpen((prev) => !prev);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl bg-white px-3 py-2.5 text-left text-sm text-slate-700 ${
                      showDeadlineError
                        ? 'border border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                        : 'border border-[#cfd8e3]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Calendar size={16} className="text-slate-500" />
                      <span>{toKoreanDateLabel(editingData.deadline)}</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{isDatePickerOpen ? '닫기' : '선택'}</span>
                  </button>

                  {isDatePickerOpen && (
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
                            onClick={() => {
                              setParsedData({ ...editingData, deadline: day.value });
                              setShowDeadlineError(false);
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
                    </div>
                  )}
                </div>
                {showDeadlineError ? (
                  <p className="mt-2 px-1 text-sm text-rose-600">
                    마감일을 입력해야 저장할 수 있습니다.
                  </p>
                ) : !editingData.deadline ? (
                  <p className="mt-2 px-1 text-sm text-rose-600">
                    마감일을 입력하지 않으면 캘린더에 표시되지 않습니다.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={editingData.original_url}
                  onChange={(e) => setParsedData({ ...editingData, original_url: e.target.value })}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  위치
                </label>
                <input
                  type="text"
                  value={editingData.location || ''}
                  onChange={(e) => setParsedData({ ...editingData, location: e.target.value || null })}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2"
                  placeholder="예: 서울 강남구"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  공고 설명/요건
                </label>
                <textarea
                  value={editingData.description || ''}
                  onChange={(e) => setParsedData({ ...editingData, description: e.target.value || null })}
                  className="min-h-[140px] w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-3"
                  placeholder="파싱된 공고 설명/요건이 여기에 표시됩니다."
                />
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editingData.company_name || !editingData.job_title || !editingData.deadline}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#136fbd] px-4 py-2 text-white shadow-[0_10px_22px_rgba(19,111,189,0.25)] transition-colors hover:bg-[#0e5a99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      저장 중...
                    </>
                  ) : (
                    '저장하기'
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-2xl border border-[#cfd8e3] px-4 py-2 hover:bg-[#f2f7fd]"
                >
                  취소
                </button>
                </div>
                {addMode === 'parse' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setParsedData(null);
                        setParseError(null);
                        setShowDeadlineError(false);
                      }}
                      className="px-1 text-sm font-semibold text-slate-500 underline-offset-2 transition-colors hover:text-slate-700 hover:underline"
                    >
                      다시 파싱하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
